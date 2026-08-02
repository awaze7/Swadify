import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const GROQ_API_KEY =
    process.env.REACT_APP_GROQ_API_KEY || process.env.GROQ_API_KEY || null;
const GROQ_API_URL =
    process.env.REACT_APP_GROQ_API_URL ||
    process.env.GROQ_API_URL ||
    "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL =
    process.env.REACT_APP_GROQ_MODEL ||
    process.env.GROQ_MODEL ||
    "llama-3.3-70b-versatile";

const CACHE_KEY = "ai_global_menu_summary";

let cachedMenuData = null;

const normalize = (value = "") =>
    value
        .toString()
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

// Grammatical filler words that carry no food meaning. Without this, a query like
// "Vada and Paav" tokenizes to ["vada", "and", "paav"], and "and" happens to
// literally match the word "and" inside combo names like "Veg Burger Wrap AND
// Side Meal" — scoring an unrelated burger combo as if it were a real match for
// vada pav. Stripping stopwords before scoring closes that hole.
const STOPWORDS = new Set([
    "a", "an", "the", "and", "or", "but", "to", "of", "in", "on", "at", "for",
    "with", "by", "from", "as", "is", "are", "was", "were", "be", "been", "being",
    "i", "me", "my", "we", "our", "us", "you", "your", "it", "its", "this",
    "that", "these", "those", "some", "any", "please", "kindly", "also",
    "need", "want", "would", "like", "looking", "give", "get", "find",
    "have", "has", "had", "can", "could", "should", "will", "today", "now",
]);

const tokenize = (query) =>
    normalize(query)
        .split(" ")
        .filter((token) => token.length > 1 && !STOPWORDS.has(token));

const parseMenuSummary = (raw) => {
    if (!raw) return { restaurants: [] };
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(data?.restaurants)) return data;
    if (Array.isArray(data)) {
        return {
            restaurants: data.map((entry) => ({
                restaurantId: entry.resId || entry.restaurantId,
                restaurantName: entry.restaurant || entry.restaurantName,
                dishes: (entry.items || entry.dishes || []).map((dish) => ({
                    id: dish.id,
                    name: dish.name,
                    category: dish.category || "",
                    isVeg: dish.isVeg === 1 || dish.isVeg === true ? 1 : 0,
                })),
            })),
        };
    }
    return { restaurants: [] };
};

const flattenMenuItems = (menuData) => {
    const restaurants = menuData?.restaurants || [];
    const seen = new Set();
    const items = [];

    restaurants.forEach((restaurant) => {
        const resId = String(restaurant.restaurantId);
        (restaurant.dishes || []).forEach((dish) => {
            const id = String(dish.id);
            // A dish can be listed more than once for the same restaurant in the
            // source data (e.g. once under "Recommended" and again under its real
            // category). Same restaurant + same id = same dish, so keep one.
            const dedupeKey = `${resId}::${id}`;
            if (seen.has(dedupeKey)) return;
            seen.add(dedupeKey);

            items.push({
                id,
                name: dish.name,
                category: dish.category || "",
                isVeg: dish.isVeg === 1,
                restaurant: restaurant.restaurantName || "Unknown",
                resId,
            });
        });
    });

    return items;
};

const getRestaurantContext = async () => {
    if (cachedMenuData) return cachedMenuData;

    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            cachedMenuData = parseMenuSummary(cached);
            if ((cachedMenuData.restaurants || []).length > 0) {
                return cachedMenuData;
            }
        }
    } catch (error) {
        // Ignore invalid cache and refetch from Firestore.
    }

    try {
        const summaryRef = doc(db, "ai_index", "global_menu_summary");
        const snapshot = await getDoc(summaryRef);
        if (snapshot.exists()) {
            cachedMenuData = parseMenuSummary(snapshot.data());
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot.data()));
            } catch (error) {
                // Ignore quota errors from localStorage.
            }
            return cachedMenuData;
        }
    } catch (error) {
        console.error("Error reading AI menu summary:", error);
    }

    cachedMenuData = { restaurants: [] };
    return cachedMenuData;
};

const isFoodRelatedQuery = (query) => {
    const text = normalize(query);
    if (text.length < 2) return false;

    const blocked = [
        "weather",
        "politics",
        "bitcoin",
        "crypto",
        "stock",
        "program",
        "code",
        "movie",
        "song",
        "lyrics",
        "translate",
        "homework",
        "math",
    ];
    if (blocked.some((term) => text.includes(term))) return false;

    const foodHints = [
        "food",
        "meal",
        "dish",
        "eat",
        "hungry",
        "craving",
        "snack",
        "breakfast",
        "lunch",
        "dinner",
        "dessert",
        "drink",
        "spicy",
        "sweet",
        "veg",
        "nonveg",
        "non veg",
        "chicken",
        "paneer",
        "biryani",
        "pizza",
        "burger",
        "pasta",
        "noodles",
        "rice",
        "roll",
        "sandwich",
        "coffee",
        "tea",
        "ice cream",
        "dosa",
        "thali",
        "momos",
        "paratha",
        "curry",
        "chaat",
        "pani",
        "pav",
        "bowl",
        "salad",
        "wrap",
        "taco",
        "shake",
        "cake",
    ];

    if (foodHints.some((term) => text.includes(term))) return true;

    // Short food-like queries such as "pani" or "mango" are still allowed.
    return text.split(" ").length <= 4;
};

const scoreItem = (item, query) => {
    const tokens = tokenize(query);
    if (tokens.length === 0) return 0;

    const wantsVeg =
        tokens.includes("veg") ||
        tokens.includes("vegetarian") ||
        query.toLowerCase().includes("pure veg");
    const wantsNonVeg =
        tokens.includes("nonveg") ||
        tokens.includes("non") ||
        query.toLowerCase().includes("non veg") ||
        tokens.includes("chicken") ||
        tokens.includes("mutton") ||
        tokens.includes("egg");

    if (wantsVeg && !item.isVeg) return 0;
    if (wantsNonVeg && item.isVeg) return 0;

    const haystack = normalize(
        `${item.name} ${item.category} ${item.restaurant}`
    );
    let score = 0;

    tokens.forEach((token) => {
        if (token === "veg" || token === "vegetarian" || token === "nonveg") {
            return;
        }
        if (haystack.includes(token)) score += 2;
        if (item.name.toLowerCase().includes(token)) score += 1;
    });

    return score;
};

const rankItems = (items, query, limit = 40) =>
    items
        .map((item) => ({ item, score: scoreItem(item, query) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ item }) => item);

// Picks a spread of items across restaurants (round-robin) instead of the first
// N in array order, which would just be whatever restaurant happens to sort
// first in Firestore. Used when keyword matching finds nothing at all, so the
// AI still gets a genuinely varied pool of alternatives to reason over.
const buildDiverseSample = (items, limit = 40) => {
    const byRestaurant = new Map();
    items.forEach((item) => {
        if (!byRestaurant.has(item.resId)) byRestaurant.set(item.resId, []);
        byRestaurant.get(item.resId).push(item);
    });
    const buckets = Array.from(byRestaurant.values());
    const sample = [];
    for (let i = 0; sample.length < limit && buckets.some((b) => i < b.length); i++) {
        for (const bucket of buckets) {
            if (sample.length >= limit) break;
            if (bucket[i]) sample.push(bucket[i]);
        }
    }
    return sample;
};

// De-dupes and caps how many dishes from the same restaurant can appear in the
// final list. Without this, "top 4 by score" could easily be 4 near-identical
// combo variants from a single restaurant/category (e.g. "Veg Burger Wrap",
// "Veg Burger Wrap with Side", "Veg Burger Wrap with Side and Beverage" ...) —
// exactly the "no variation" complaint. Falls back to filling remaining slots
// without the cap if there simply aren't enough distinct restaurants in the pool.
const diversify = (items, limit = 4, perRestaurantCap = 2) => {
    const result = [];
    const seenKey = new Set();
    const perRestaurantCount = new Map();

    for (const item of items) {
        if (result.length >= limit) break;
        const key = `${item.resId}::${item.id}`;
        if (seenKey.has(key)) continue;
        const count = perRestaurantCount.get(item.resId) || 0;
        if (count >= perRestaurantCap) continue;
        seenKey.add(key);
        perRestaurantCount.set(item.resId, count + 1);
        result.push(item);
    }

    if (result.length < limit) {
        for (const item of items) {
            if (result.length >= limit) break;
            const key = `${item.resId}::${item.id}`;
            if (seenKey.has(key)) continue;
            seenKey.add(key);
            result.push(item);
        }
    }

    return result;
};

const formatDishes = (items) =>
    diversify(items, 4, 2).map((item) => ({
        id: item.id,
        name: item.name,
        restaurant: item.restaurant,
        resId: item.resId,
        price: item.price || 0,
        imageId: item.imageId || "",
        category: item.category || "",
    }));

const extractJsonFromText = (text) => {
    if (!text) return null;
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
        return JSON.parse(cleaned);
    } catch (error) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return null;
        try {
            return JSON.parse(match[0]);
        } catch (innerError) {
            return null;
        }
    }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGroq = async (systemPrompt, userPrompt, retries = 2) => {
    if (!GROQ_API_KEY) {
        return { error: "missing_api_key" };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(GROQ_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt },
                    ],
                    response_format: { type: "json_object" },
                    // Low temperature was part of why replies felt templated — it
                    // biases the model toward the single "safest"/most generic
                    // completion every time, which is the opposite of what we want
                    // for a conversational reply. JSON mode still enforces valid
                    // structure regardless of temperature, so this only adds
                    // wording variety, not structural risk.
                    temperature: 0.85,
                    max_tokens: 900,
                }),
            });

            if (!response.ok) {
                const body = await response.text();
                if (response.status === 429 && attempt < retries) {
                    await delay(1000 * Math.pow(2, attempt));
                    continue;
                }
                console.error("Groq API error:", response.status, body);
                return { error: "api_error", status: response.status, body };
            }

            const json = await response.json();
            const content = json?.choices?.[0]?.message?.content;
            return { ok: true, content, json };
        } catch (error) {
            if (attempt === retries) {
                console.error("Groq network error:", error);
                return { error: "network" };
            }
            await delay(500 * Math.pow(2, attempt));
        }
    }

    return { error: "failed" };
};

const buildAiPrompt = (userQuery, candidates) => {
    const compactCandidates = candidates.map((item) => ({
        id: item.id,
        name: item.name,
        restaurant: item.restaurant,
        resId: item.resId,
        category: item.category,
        isVeg: item.isVeg,
    }));

    return {
        systemPrompt: `You are CraveAI, a food-only assistant for the Swadify app.

Rules:
- Only help users find dishes from the provided menu candidates.
- If the query is not about food or cravings, set isFoodQuery to false and return an empty dishes array.
- Never invent dishes. Only pick from the candidates list using exact ids.
- Return valid JSON only.

How to pick dishes:
- Use real-world common sense about food, the same way a knowledgeable friend
  would, not just keyword overlap. Reason about temperature (hot vs cold),
  form/texture (solid, liquid, semi-solid), spice level, cuisine, and meal type
  when matching a craving to a candidate. For example, someone asking for
  something "cold and solid" wants things like ice cream or a chilled dessert,
  not a hot combo meal that happens to share a word with the query.
- The candidate list may contain irrelevant items (it was pre-filtered by
  simple keyword search, not by you). Only select candidates that a person
  would genuinely consider a good match for the query — it is fine to return
  fewer than 4 dishes, or even zero, if nothing in the list is actually a good
  fit. Do not force a match just to fill slots.
- If the user's exact request (e.g. a specific named dish) is not present in
  the candidates, do NOT silently substitute something unrelated. Say so
  plainly in "reply" (e.g. "We don't have vada pav right now, but here are a
  few similar options:") before naming the alternatives you picked.
- Prefer variety in the results: when several good matches exist, favor
  spreading picks across different restaurants and different dish types
  rather than returning several near-identical variants of the same combo
  from one restaurant (e.g. avoid returning "X", "X with side", and "X with
  side and drink" all at once — pick the one or two that best fit instead).

Voice for "reply" — read this closely, it's the part that most needs work:
Write like a friend who knows the local food scene and is texting back
someone who just said what they're craving — not a system confirming a
search query. React to what they actually said. Vary sentence shape and
opener every time; never fall back to one default template.

Banned — do not write sentences shaped like these, ever:
- "I found N dishes that match your craving."
- "Here are some dishes that match your craving."
- "Here are the closest matches I found."
These are exactly the flat, robotic pattern to avoid.

Instead, write like:
- "Something cold sounds great right now — here's what's chilled and ready:"
- "No vada pav on the menu today, but these street-food bites might scratch
  the itch:"
- "Not sure what you're picturing yet — a cuisine, a mood, or a dish name
  would help me narrow it down."
- "Spicy it is. A couple of these bring real heat:"

Keep it to one, occasionally two, short sentences. At most one emoji, and
only when it genuinely fits — don't decorate every reply with one. Sound
like a person who's actually looked at the options, not a template with the
count and query swapped in.`,
        userPrompt: `User query: "${userQuery}"

Candidates (pre-filtered by keyword search, may include irrelevant items — use your judgment):
${JSON.stringify(compactCandidates)}

Return JSON with this exact shape:
{
  "isFoodQuery": true,
  "reply": "short friendly sentence, acknowledging if the exact request wasn't available",
  "dishes": [
    { "id": "...", "name": "...", "restaurant": "...", "resId": "..." }
  ]
}

Pick up to 4 best matches, prioritizing genuine relevance and variety over quantity.`,
    };
};

const resolveAiDishes = (parsed, allItems) => {
    // Keyed on (resId, id) rather than bare id. Bare-id lookups break when two
    // different restaurants happen to reuse the same numeric id (a real
    // possibility in this menu data) — the model could ask for a Cafe Goodluck
    // dish and silently get handed a same-numbered Faasos dish instead.
    const byKey = new Map(allItems.map((item) => [`${item.resId}::${item.id}`, item]));
    const byIdFallback = new Map(allItems.map((item) => [String(item.id), item]));

    const selected = (parsed?.dishes || [])
        .map((dish) => byKey.get(`${dish.resId}::${dish.id}`) || byIdFallback.get(String(dish.id)))
        .filter(Boolean);

    const unique = [];
    const seen = new Set();
    selected.forEach((item) => {
        const key = `${item.resId}::${item.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(item);
    });

    return unique;
};

const pickVariant = (options) => options[Math.floor(Math.random() * options.length)];

// Code-level fallback lines (used when we're not quoting the AI's own reply).
// Kept in the same "friend, not a form" voice as the system prompt so the
// experience doesn't shift tone depending on which path handled the request.
// Several options per case so the same situation doesn't always produce the
// exact same sentence.
const REPLY_VARIANTS = {
    notFood: [
        "Food's my whole thing, tell me what you're craving and I'll take it from there!",
        "That one's outside my lane, but food I can do. What sounds good right now?",
        "I'm strictly a food assistant, give me a dish, cuisine, or craving to work with.",
    ],
    menuUnavailable: [
        "Give me just a second, menu data isn't loaded yet. Try again in a moment?",
        "Menus are still loading on my end, mind trying that again shortly?",
    ],
    missingKeyWithSignal: [
        "My smart matching is offline for the moment, but these keyword matches look close:",
        "Running on backup mode right now, here's what matched by keyword:",
    ],
    missingKeyNoSignal: [
        "My smart matching is offline right now, and I couldn't find a keyword match either — try describing it differently?",
        "Running on backup mode and coming up empty here, could you rephrase that a bit?",
    ],
    rateLimitedWithSignal: [
        "I'm getting a lot of requests right now, here's what matched locally in the meantime:",
        "Things are busy on my end, but these keyword matches should tide you over:",
    ],
    rateLimitedNoSignal: [
        "I'm a little swamped right now and coming up short on this one, try again in a bit?",
        "A bit overloaded at the moment, give me a few seconds and try again?",
    ],
    unclearQuery: [
        "Not quite sure what you're picturing. A cuisine, mood, or dish name would help.",
        "Give me a bit more to go on — what are you in the mood for?",
    ],
    aiFoundNoReplyText: [
        "Here's what stood out for that one:",
        "These caught my eye for what you described:",
    ],
    fallbackWithSignal: [
        "Couldn't put together a smart answer just now, but these keyword matches are worth a look:",
        "AI's a bit quiet right now, here's what matched by keyword instead:",
    ],
    fallbackNoSignal: [
        "Couldn't turn up anything close to that, want to try describing it differently?",
        "Nothing matched that one, a cuisine, dish name, or craving might help me out.",
    ],
    unexpectedError: [
        "Having some trouble checking the menus right now, give it another shot?",
        "Something hiccuped on my end, mind trying that again in a moment?",
    ],
};

export const fetchAiResponse = async (userQuery) => {
    if (!isFoodRelatedQuery(userQuery)) {
        return {
            reply: pickVariant(REPLY_VARIANTS.notFood),
            dishes: [],
        };
    }

    try {
        const menuData = await getRestaurantContext();
        const allItems = flattenMenuItems(menuData);

        if (allItems.length === 0) {
            return {
                reply: pickVariant(REPLY_VARIANTS.menuUnavailable),
                dishes: [],
            };
        }

        // Local keyword ranking now only builds a compact candidate pool for the
        // AI to reason over — it is never treated as the final answer by itself.
        // Previously, finding 2+ keyword matches returned them straight to the
        // user and skipped the AI call entirely. That's why vague, natural
        // phrasing ("cold and solid form") or near-misses ("vada and paav")
        // produced literal keyword noise (e.g. matching the word "and" inside
        // "Veg Burger Wrap AND Side Meal") instead of a reasoned suggestion —
        // the AI never actually got a chance to look at the query.
        let candidatePool = rankItems(allItems, userQuery, 40);
        let poolHasKeywordSignal = candidatePool.length > 0;

        if (candidatePool.length === 0) {
            const firstToken = tokenize(userQuery)[0];
            if (firstToken) {
                candidatePool = rankItems(allItems, firstToken, 25);
                poolHasKeywordSignal = candidatePool.length > 0;
            }
        }

        if (candidatePool.length === 0) {
            // Nothing matched by keyword at all — give the AI a diverse
            // cross-section of the menu so it has real alternatives to reason
            // about instead of an arbitrary "first 30 items" slice.
            candidatePool = buildDiverseSample(allItems, 40);
            poolHasKeywordSignal = false;
        }

        const { systemPrompt, userPrompt } = buildAiPrompt(userQuery, candidatePool);
        const aiResult = await callGroq(systemPrompt, userPrompt);

        if (aiResult.error === "missing_api_key") {
            return poolHasKeywordSignal
                ? {
                      reply: pickVariant(REPLY_VARIANTS.missingKeyWithSignal),
                      dishes: formatDishes(candidatePool),
                  }
                : {
                      reply: pickVariant(REPLY_VARIANTS.missingKeyNoSignal),
                      dishes: [],
                  };
        }

        if (aiResult.error === "api_error" && aiResult.status === 429) {
            return poolHasKeywordSignal
                ? {
                      reply: pickVariant(REPLY_VARIANTS.rateLimitedWithSignal),
                      dishes: formatDishes(candidatePool),
                  }
                : {
                      reply: pickVariant(REPLY_VARIANTS.rateLimitedNoSignal),
                      dishes: [],
                  };
        }

        if (aiResult.ok) {
            const parsed = extractJsonFromText(aiResult.content);
            if (parsed?.isFoodQuery === false) {
                return {
                    reply: pickVariant(REPLY_VARIANTS.unclearQuery),
                    dishes: [],
                };
            }

            const resolved = resolveAiDishes(parsed, allItems);
            if (resolved.length > 0) {
                return {
                    reply: parsed?.reply || pickVariant(REPLY_VARIANTS.aiFoundNoReplyText),
                    dishes: formatDishes(resolved),
                };
            }

            // The AI deliberately returned no dishes (per the prompt, it's told
            // this is fine when nothing genuinely fits) but did explain itself —
            // trust that honest answer instead of papering over it with an
            // unrelated local match.
            if (parsed?.reply) {
                return { reply: parsed.reply, dishes: [] };
            }
        }

        // AI call failed outright (network error, malformed response, etc.) or
        // returned nothing usable and no explanation. Fall back to the local
        // pool only if it's backed by real keyword relevance — otherwise be
        // honest that nothing good was found rather than showing a random
        // diverse sample as if it were a match.
        if (poolHasKeywordSignal) {
            return {
                reply: pickVariant(REPLY_VARIANTS.fallbackWithSignal),
                dishes: formatDishes(candidatePool),
            };
        }

        return {
            reply: pickVariant(REPLY_VARIANTS.fallbackNoSignal),
            dishes: [],
        };
    } catch (error) {
        console.error("AI flow error:", error);
        return {
            reply: pickVariant(REPLY_VARIANTS.unexpectedError),
            dishes: [],
        };
    }
};
