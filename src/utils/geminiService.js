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

// Matched as whole tokens, not substrings. The previous `text.includes(term)`
// check rejected legitimate food talk that merely contained one of these as a
// substring, and "stock" in particular is an ordinary cooking word.
const BLOCKED_TERMS = new Set([
    "weather",
    "politics",
    "political",
    "bitcoin",
    "crypto",
    "stocks",
    "program",
    "programming",
    "code",
    "movie",
    "movies",
    "song",
    "songs",
    "lyrics",
    "translate",
    "homework",
    "math",
]);

/**
 * @param {string} query - the message the user just sent
 * @param {boolean} hasActiveConversation - whether the user has already
 *   exchanged food turns with the assistant in this session
 *
 * The `hasActiveConversation` branch is the important one. The word-count
 * heuristic below only ever made sense for a cold opener: it accepts a short
 * query on faith and rejects anything longer that lacks an explicit food word.
 * Applied to a follow-up, it rejects exactly the phrasing a real conversation
 * produces — "yeah that looks good but do you have something a bit lighter" has
 * no food noun and is 12 words, so it was answered with "Food's my whole
 * thing!" in the middle of a food conversation. Once a food conversation is
 * underway, the follow-up is on-topic unless it hits a hard blocked term.
 */
const isFoodRelatedQuery = (query, hasActiveConversation = false) => {
    const text = normalize(query);
    if (text.length < 2) return false;

    const tokens = text.split(" ");
    if (tokens.some((token) => BLOCKED_TERMS.has(token))) return false;

    if (hasActiveConversation) return true;

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

const callGroq = async (systemPrompt, turns, retries = 2) => {
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
                    // Prior turns are replayed as real `user`/`assistant`
                    // messages rather than pasted into one blob of user text.
                    // The model is trained to treat this structure as dialogue,
                    // so pronouns and elisions ("that one", "something lighter",
                    // "the second") resolve against earlier turns instead of
                    // being read as a brand-new standalone search.
                    messages: [{ role: "system", content: systemPrompt }, ...turns],
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

// How many prior turns to replay to the model. Enough for a real back-and-forth
// to hold together, small enough that the candidate list (the far larger part of
// the payload) stays the dominant cost.
const HISTORY_TURN_LIMIT = 10;

/**
 * Converts the UI's stored transcript into Groq chat turns.
 *
 * Two shapes need flattening. The UI stores a dish carousel as its own message
 * with `type: 'dishes'` and an array payload; sent raw, `content` would be an
 * object and the API would reject it. More importantly, the model needs to know
 * *which dishes it already offered* — otherwise a follow-up like "the second
 * one" or "anything but that biryani" has no referent, and the model re-suggests
 * dishes it just showed. So each carousel becomes a short text line naming what
 * was recommended.
 */
const buildHistoryTurns = (history = []) => {
    const turns = [];

    history.forEach((msg) => {
        if (!msg || !msg.role) return;

        // Client-side failure notices ("something went sideways on my end") are
        // written by the UI, not produced here. Replaying them as assistant
        // history made the model believe it had failed on a turn it never saw,
        // and it would then apologise for a request that had succeeded.
        if (msg.transient) return;

        if (msg.type === "dishes") {
            const names = (Array.isArray(msg.content) ? msg.content : [])
                .map((dish) => `${dish.name} (${dish.restaurant})`)
                .filter(Boolean);
            if (names.length === 0) return;
            turns.push({
                role: "assistant",
                content: `[Previously recommended: ${names.join("; ")}]`,
            });
            return;
        }

        if (typeof msg.content !== "string" || !msg.content.trim()) return;
        turns.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
        });
    });

    // Trim from the end so the most recent context survives, and never lead
    // with an assistant turn — some providers reject a history that opens on
    // one, and it reads as a dangling half-exchange regardless.
    const trimmed = turns.slice(-HISTORY_TURN_LIMIT);
    while (trimmed.length > 0 && trimmed[0].role !== "user") trimmed.shift();
    return trimmed;
};

const buildAiPrompt = (userQuery, candidates, history = []) => {
    const compactCandidates = candidates.map((item) => ({
        id: item.id,
        name: item.name,
        restaurant: item.restaurant,
        resId: item.resId,
        category: item.category,
        isVeg: item.isVeg,
    }));

    const historyTurns = buildHistoryTurns(history);

    return {
        systemPrompt: `You are CraveAI, a food-only assistant for the Swadify app.

Rules:
- Only help users find dishes from the provided menu candidates.
- If the query is not about food or cravings, set isFoodQuery to false and return an empty dishes array.
- Never invent dishes. Only pick from the candidates list using exact ids.
- Return valid JSON only.

You are in an ongoing conversation — this is the most important thing to get right:
- The messages before this one are the real conversation so far. Read them.
  You are continuing a chat, not answering a fresh search query each time.
- Resolve references against earlier turns. "That one", "the second", "the
  paneer one", "same but cheaper", "something lighter", "no, spicier" only mean
  something in context. Work out what the user is pointing at before answering.
- Carry constraints forward until the user changes them. If they said veg
  earlier, they are still veg. If they said no onion, under 300, or "from that
  first restaurant", that still holds on the next turn — don't make them repeat
  it.
- Don't re-recommend dishes you already offered (they appear as
  "[Previously recommended: ...]") unless the user asks about one specifically.
  Suggest something new, or explain that you're out of good options.
- Don't re-introduce yourself, re-greet, or restate what the user just asked.
  Pick up mid-conversation the way a person does.
- If the user is only reacting ("nice", "not really", "hmm") with nothing to
  act on, just respond naturally and return zero dishes. Not every turn needs
  a dish carousel attached — a conversation has turns that are purely talk.
- When you genuinely need one more detail to give a good answer, ask a single
  short question instead of guessing. One question, not a list.

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
- "Lighter it is — these won't sit as heavy:"
- "Good call, that one's rich. Want me to stay veg, or open it up?"
- "Spicy it is. A couple of these bring real heat:"

Keep it to one, occasionally two, short sentences. At most one emoji, and
only when it genuinely fits — don't decorate every reply with one. Sound
like a person who's actually looked at the options, not a template with the
count and query swapped in.`,
        turns: [
            ...historyTurns,
            {
                role: "user",
                content: `${userQuery}

---
(System note — not part of the user's message.)
Menu candidates available to you right now, pre-filtered by keyword search
against this conversation, so the list may include irrelevant items. Use your
judgment, and only pick ids from this list:
${JSON.stringify(compactCandidates)}

Reply to the user's message above, continuing the conversation.

Return JSON with this exact shape:
{
  "isFoodQuery": true,
  "reply": "short, in-context sentence — no greeting, no restating the question",
  "dishes": [
    { "id": "...", "name": "...", "restaurant": "...", "resId": "..." }
  ],
  "followUps": ["...", "..."]
}

Include up to 4 dishes, prioritizing genuine relevance and variety over
quantity. Return an empty dishes array when the turn doesn't call for
suggestions (a clarifying question, or a reply to small talk).

"followUps" is 0-3 very short replies written in the USER's voice — the
natural next things *they* might say, which you could actually act on. Think
"Something spicier", "Only veg", "What's cheapest?" — not questions aimed at
the user, and not things you can't answer. Keep each under 5 words. Return an
empty array when the conversation doesn't obviously continue.`,
            },
        ],
    };
};

const resolveAiDishes = (parsed, allItems) => {
    // Keyed on (resId, id) rather than bare id. Bare-id lookups break when two
    // different restaurants happen to reuse the same numeric id (a real
    // possibility in this menu data), the model could ask for a Cafe Goodluck
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

/**
 * Builds the string used for *keyword retrieval* (not the string shown to the
 * model — that stays the user's real words).
 *
 * Follow-up turns are the problem this solves. "something lighter" or "any of
 * those but veg" contain no dish noun, so ranking them alone returns an empty
 * pool and the model gets handed a random cross-section of the menu — which is
 * why follow-ups produced unrelated suggestions and the chat felt like it had
 * forgotten the topic. Folding in the recent user turns keeps retrieval anchored
 * to what the conversation is actually about, while the current message stays
 * first so its tokens still dominate the ranking.
 */
const buildRetrievalQuery = (userQuery, history = []) => {
    const recentUserText = history
        .filter((msg) => msg?.role === "user" && typeof msg.content === "string")
        .slice(-3)
        .map((msg) => msg.content)
        .join(" ");

    return recentUserText ? `${userQuery} ${recentUserText}` : userQuery;
};

// Sanitizes model-authored follow-up chips. These get rendered as tappable
// buttons that send text as the user, so they need to be short and finite
// regardless of what the model returns.
const normalizeFollowUps = (raw) => {
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    return raw
        .filter((s) => typeof s === "string")
        .map((s) => s.trim().replace(/\s+/g, " "))
        .filter((s) => {
            if (s.length < 2 || s.length > 40) return false;
            const key = s.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 3);
};

/**
 * @param {string} userQuery - the message the user just sent
 * @param {Array} history - prior transcript messages, oldest first, in the
 *   UI's `{ role, content, type }` shape. Defaults to empty so the signature
 *   stays backwards-compatible with a single-shot call.
 */
export const fetchAiResponse = async (userQuery, history = []) => {
    const priorUserTurns = history.filter((msg) => msg?.role === "user").length;

    if (!isFoodRelatedQuery(userQuery, priorUserTurns > 0)) {
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

        const retrievalQuery = buildRetrievalQuery(userQuery, history);

        // Local keyword ranking now only builds a compact candidate pool for the
        // AI to reason over — it is never treated as the final answer by itself.
        // Previously, finding 2+ keyword matches returned them straight to the
        // user and skipped the AI call entirely. That's why vague, natural
        // phrasing ("cold and solid form") or near-misses ("vada and paav")
        // produced literal keyword noise (e.g. matching the word "and" inside
        // "Veg Burger Wrap AND Side Meal") instead of a reasoned suggestion —
        // the AI never actually got a chance to look at the query.
        let candidatePool = rankItems(allItems, retrievalQuery, 40);
        let poolHasKeywordSignal = candidatePool.length > 0;

        if (candidatePool.length === 0) {
            const firstToken = tokenize(retrievalQuery)[0];
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

        const { systemPrompt, turns } = buildAiPrompt(userQuery, candidatePool, history);
        const aiResult = await callGroq(systemPrompt, turns);

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
            const followUps = normalizeFollowUps(parsed?.followUps);

            if (resolved.length > 0) {
                return {
                    reply: parsed?.reply || pickVariant(REPLY_VARIANTS.aiFoundNoReplyText),
                    dishes: formatDishes(resolved),
                    followUps,
                };
            }

            // The AI deliberately returned no dishes (per the prompt, it's told
            // this is fine when nothing genuinely fits, and when the turn is a
            // clarifying question or plain conversation) but did explain
            // itself — trust that honest answer instead of papering over it
            // with an unrelated local match.
            if (parsed?.reply) {
                return { reply: parsed.reply, dishes: [], followUps };
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
