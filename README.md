# Swadify

A full-stack food ordering application built with React 19, Redux Toolkit, TanStack Query and Firebase. Swadify covers the complete customer journey: browsing restaurants, exploring menus, building a cart, placing an order, and tracking it from a profile page. It also ships **CraveAI**, a conversational assistant that recommends real dishes from the live catalogue using a retrieval-augmented pipeline over a Groq-hosted Llama 3.3 70B model.

**Live application:** https://swadify.netlify.app

---

## Highlights

- **Conversational dish discovery (CraveAI).** A multi-turn assistant that reads the menu catalogue, retrieves candidate dishes for the user's request, and asks the model to pick and justify a shortlist. Every suggestion resolves back to a real menu item and deep-links straight to that dish on the restaurant page.
- **Complete order lifecycle.** Cart to checkout to a persisted Firestore order document to a confirmation screen to order history, with reorder in a single tap.
- **Server state handled properly.** Restaurant lists, menus and order history are cached through TanStack Query with per-query stale times, error-aware retry predicates and exponential backoff. Redux holds only client state (cart, session, chat transcript, the order currently being confirmed).
- **Failures are classified, not swallowed.** Firestore and Firebase Auth errors are mapped to a small set of kinds (network, permission, unauthenticated, configuration, quota, unknown), each with its own copy and its own recovery action. Retryable failures retry automatically; the rest offer the user the one action that can actually help.
- **Accessibility treated as a requirement.** Keyboard-operable accordions, steppers, sort controls and dish cards; labelled landmarks and a skip link; live regions for asynchronous updates; a pause control on the auto-scrolling carousel; and `prefers-reduced-motion` respected across every animation.

---

## Feature overview

### Browse and search

- Restaurant catalogue read from Firestore, normalised from several upstream payload shapes into one predictable model with stable ids.
- Search across restaurant names and cuisines, a top-rated filter, and sorting by delivery time, rating or cost in either direction.
- An auto-scrolling "handpicked" carousel with a visible pause control, a duplicated track for seamless looping, and the duplicate set removed from the tab order and the accessibility tree.
- Skeleton loaders that mirror the real geometry of the content they stand in for, so the page does not shift when data lands.

### Menus and cart

- Collapsible menu categories built on real buttons with `aria-expanded`, so the entire menu is operable by keyboard.
- A single shared price resolver reconciles the three different price fields the upstream data uses, and falls back to parsing a price out of the item name. The cart, the checkout review and the persisted order all read the same number.
- Quantity is derived state: the cart reducer recomputes its subtotal after every mutation, decrementing to zero removes the line, and quantities are clamped in the reducer so every entry point (menu stepper, cart page, reorder) is capped identically.
- Cart entries carry the restaurant they came from, so the order written at checkout knows which kitchen it belongs to.

### Accounts and sessions

- Email and password authentication through Firebase Auth, with a Firestore profile document holding name, phone and delivery address.
- A root-level `onAuthStateChanged` subscription rehydrates the Redux session on page load, so a refresh no longer presents a signed-in user with a login prompt. A failed profile read degrades to an auth-only session instead of failing the sign-in.
- Login preserves navigation intent: an anonymous user who hits checkout is returned to checkout after signing in. Only same-origin relative paths are honoured, so the redirect cannot be used as an open redirect.
- One shared logout implementation signs out of Firebase, clears the Redux session, clears the chat transcript and flushes the query cache, so no per-user data survives into the next session on a shared browser.
- Editable profile written with `setDoc(..., { merge: true })`, which also works for accounts that exist in Auth without a profile document yet.

### Checkout and orders

- Checkout gates in a deliberate order: offline, then auth loading, then not signed in, then empty cart, so the user always sees the most specific explanation available.
- Address and phone are prefilled from the saved profile and re-synced once the asynchronous session resolves.
- Order totals are computed in one module: item subtotal, 5% GST, 5% platform fee and a flat delivery fee, with cash on delivery as the payment method.
- Orders are written to a per-user Firestore subcollection with a server timestamp, then read back through a dedicated query hook ordered newest first.
- The confirmation screen falls back to fetching the order by its id from the URL, so refreshing or reopening the link still resolves. Every line of the bill is displayed and reconciles against its own total.
- Order history renders four distinct states (first load, classified failure with retry, genuine empty, data) and never shows a spinner over cached data. Background revalidation is indicated separately.
- Reorder rebuilds the cart in one dispatch per line, skips items that are no longer resolvable, and reports how many were dropped.

### CraveAI assistant

A floating, resizable panel mounted globally, so the assistant is reachable from every page and survives navigation.

**Retrieval.** A precomputed menu summary document is fetched once, prefetched at app start and cached in `localStorage`, which keeps the assistant off the per-request Firestore read path entirely. Items are flattened and deduplicated on a composite `restaurantId::itemId` key.

**Ranking.** Queries are normalised, tokenised and stripped of stopwords, then scored against the catalogue with hard filters for vegetarian and non-vegetarian intent. A round-robin sample across restaurants plus a per-restaurant cap keeps the candidate pool diverse instead of returning five variations of the same dish from one kitchen.

**Generation.** The shortlist is passed to Llama 3.3 70B in JSON mode. Returned ids are resolved back to real menu items, so the assistant can never invent a dish that does not exist. Rate limits are retried with exponential backoff; a missing key or a network failure degrades to keyword ranking rather than an error message.

**Conversation.** Recent turns are replayed to the model as real conversation history, with previous dish carousels flattened into text so the model knows what it has already suggested. Constraints stated once carry forward, which means a follow-up like "something lighter" resolves correctly even though it contains no food term of its own. The model authors its own follow-up suggestions, which are sanitised and rendered as one-tap chips on the newest turn only. The transcript is persisted to `localStorage` behind a bounded window, and a "new chat" control drops accumulated context.

**Handoff.** Selecting a dish closes the panel and navigates to that restaurant's menu with the dish as a query parameter. The menu opens the right category, scrolls the dish into view and highlights it as rendered state rather than by mutating class names from a timer.

### Resilience

- Connectivity is seeded from `navigator.onLine` and tracked through events, so loading the app while already offline shows the offline screen instead of a broken page.
- A dedicated route-level error page for unmatched paths.
- Toast durations differ by severity, because a confirmation and an explanation of what went wrong do not need the same time on screen.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| UI | React 19, function components and hooks |
| Routing | React Router 7 (`createBrowserRouter`, nested layout route) |
| Client state | Redux Toolkit (cart, user, AI chat, current order) |
| Server state | TanStack Query 5 |
| Backend | Firebase Auth and Cloud Firestore |
| AI | Groq API, Llama 3.3 70B, JSON response mode |
| Forms | React Hook Form with Yup schema resolvers |
| Styling | Tailwind CSS 3 with PostCSS |
| Animation | Anime.js 4 (scoped timelines, staggered entrances) |
| Notifications | react-toastify behind a thin wrapper |
| Bundler | Parcel 2 |

---

## Architecture

```
src/
  App.js                      Router, providers, layout shell, skip link, AI prefetch
  containers/                 Route-level screens
    Body                      Restaurant catalogue: search, sort, filter, carousel
    RestaurantMenu            Menu with collapsible categories and AI deep-link handling
    Cart / Checkout           Cart review, order form, totals, order creation
    OrderConfirmation         Post-order receipt with id-based fallback fetch
    Profile                   Profile details plus order history
    Login / Signup            Validated auth flows
    Error / Offline           Route and connectivity fallbacks
  components/                 Presentational and composite UI
    Button, Avatar, EmptyState, ErrorState, QuantityStepper, ...
    CraveAIAssistant          Floating, resizable, keyboard-operable chat panel
    OrderHistorySection, OrderDetailModal, ProfileHeader, ProfileActions
  utils/
    geminiService.js          Retrieval, ranking, prompt assembly, Groq call, fallbacks
    orderUtils.js             Totals, order creation, status labels
    priceUtils.js             Single source of truth for unit price
    firestoreErrors.js        Error classification and user-facing copy
    authErrors.js             Firebase Auth error copy
    useOrderHistory.js        Cached, retry-aware order history query
    useRestaurantMenu.jsx     Cached menu query with not-found on the success path
    useAuthSync.js            Session rehydration at app root
    useLogout.js              One logout for the whole app
    useOnlineStatus.jsx       Connectivity
    useReducedMotion.js       Motion preference
    Redux/                    Store and slices
```

**State ownership.** The split is deliberate. Anything the server owns lives in the query cache: restaurant lists, menus, order history. Anything the client owns lives in Redux: the cart, the session, the chat transcript, and the single order being confirmed. The order slice is intentionally minimal for the same reason. Mirroring the order list into Redux would create two sources of truth for the same data.

**Presentation layer.** Buttons, empty states, error states and avatars are centralised. Buttons in particular are generated from a closed set of variants and sizes, which replaced seventeen divergent spellings of the same control and fixed several submit buttons that had no visible focus style at all.

### Firestore data model

| Path | Contents |
| --- | --- |
| `restaurants_data/{doc}` | Restaurant catalogue snapshots |
| `menus/{restaurantId}` | Full menu for one restaurant |
| `users/{uid}` | Profile: name, email, phone, delivery address |
| `orders/{uid}/orders/{orderId}` | One order: items, totals, address, status, timestamps |
| `ai_index/global_menu_summary` | Precomputed, compact menu index for retrieval |

---

## Running locally

**Requirements:** Node.js 18 or newer, a Firebase project with Auth and Firestore enabled, and a Groq API key.

```bash
git clone https://github.com/awaze7/Swadify.git
cd Swadify
npm install
```

Create a `.env` file in the project root:

```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=

REACT_APP_GROQ_API_KEY=
REACT_APP_GROQ_MODEL=llama-3.3-70b-versatile
```

`.env` is gitignored. No credentials are committed.

```bash
npm start     # development server on http://localhost:1234
npm run build # production bundle in dist/
```

The application runs without a Groq key. CraveAI detects the missing key and falls back to keyword-based ranking instead of failing.

---

## Engineering notes

A few decisions worth calling out, since they shaped most of the codebase:

**One source of truth per value.** Unit price, order totals and button styling each live in exactly one module. Before that consolidation the cart and the checkout disagreed on the delivery fee, and the confirmation screen read a field the order document did not have, so it displayed a bill whose lines did not add up to its own total.

**Empty is not an error.** A restaurant with no published menu, a user with no orders and a search with no matches are all valid outcomes. Each gets an empty state, not an error panel, and only genuine failures get the retry treatment.

**Loading, refreshing and failing are three different states.** Query hooks expose them separately, so a background revalidation shows a small indicator instead of replacing content the user is already reading.

**Interactive means interactive.** Menu accordions, sort options, AI dish cards and order cards were all clickable `div` elements at one point, which made ordering food impossible by keyboard. They are real buttons and inputs now, with the visual design unchanged.

**The AI cannot hallucinate inventory.** The model chooses from a shortlist and returns ids, which are resolved against the real catalogue before anything is rendered. That constraint is what makes the feature trustworthy enough to route users into a checkout flow.

---

## Author

**Awaze Shaikh**
[GitHub](https://github.com/awaze7) · [LinkedIn](https://www.linkedin.com/in/awazeshaikh7/)
