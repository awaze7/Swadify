# Swadify

Swadify is a food ordering web app built with React 19, Redux Toolkit, TanStack Query and Firebase. It covers the complete customer journey: browsing restaurants, exploring menus, building a cart, paying through Razorpay or cash on delivery, and following the order live from placement to the doorstep. It also ships **CraveAI**, a conversational assistant that recommends real dishes from the live catalogue using a retrieval-augmented pipeline over a Groq-hosted Llama 3.3 70B model, and a personal **spending insights** dashboard that turns a user's order history into charts.

**Live application:** https://swadify.netlify.app

---

## Highlights

- **Conversational dish discovery (CraveAI).** A multi-turn assistant that reads the menu catalogue, retrieves candidate dishes for the user's request, and asks the model to pick and justify a shortlist. Every suggestion resolves back to a real menu item and deep-links straight to that dish on the restaurant page.
- **Live order tracking.** Once an order is placed the customer follows it on a real-time timeline (received, preparing, out for delivery, delivered), with a per-second ETA countdown, a delivery-celebration moment, and a persistent banner offering a one-tap route back to tracking from anywhere in the app.
- **Real payments, honestly modelled.** Razorpay checkout for UPI, card and net banking, with cash on delivery as a first-class alternative. The Firestore order is written only after a successful charge, so a cancelled or failed payment never leaves an orphaned order behind.
- **Order cancellation to industry rules.** An order can be cancelled while it is still received or preparing; once a rider is on the way the option locks, and prepaid cancellations surface a refund note.
- **Personal spending insights.** A dashboard built on Recharts turns order history into a monthly-spend line chart, a favourite-cuisines donut, and a most-ordered-items bar chart, all theme-aware.
- **Dark mode across the whole app.** A class-based theme with a system-preference default, no flash of the wrong theme on load, and every surface, modal, chart and toast covered.
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

### Checkout and payments

- Checkout gates in a deliberate order: offline, then auth loading, then not signed in, then empty cart, so the user always sees the most specific explanation available.
- Address and phone are prefilled from the saved profile and re-synced once the asynchronous session resolves.
- Order totals are computed in one module: item subtotal, 5% GST, 5% platform fee and a flat delivery fee. The same figure the customer approves is the figure written to the order.
- **Payment method is a real choice.** UPI, card and net banking are offered through Razorpay, alongside cash on delivery. UPI is the sensible default, and each option is a labelled radio in a proper `radiogroup`.
- **Payment precedes the order for online methods.** For UPI, card or net banking the Razorpay modal opens first; the Firestore order is created only after the charge succeeds, stamped with `paymentStatus: 'paid'` and the `razorpay_payment_id`. A dismissed modal is treated as an explicit cancellation, keeps the cart intact, and never writes an order. Cash on delivery skips straight to order creation.
- Every order records its `paymentMethod`, an `estimatedDelivery` timestamp derived from the restaurant's SLA, and a server `createdAt`, then initialises its own tracking fields so the live timeline is ready the moment the customer lands on it.

### Live order tracking

The screen a food app's customers visit most, built to match what Swiggy and Zomato do.

- **Real-time status.** An `onSnapshot` listener on the order document drives the UI, so status changes appear without a refresh. Progress is shown two ways at once: a horizontal stepper in the hero and a detailed vertical timeline with per-step timestamps pulled from the order's `trackingHistory`.
- **Status that actually advances.** A pure, backend-free scheduler models the real shape of a delivery, kitchen prep plus a last-mile ride, and advances the order through received, preparing, out for delivery and delivered. Delays are derived from the restaurant's own delivery time (last mile is 45% of the total, clamped to 8 to 15 minutes), and the schedule is recomputed from `createdAt` on every visit, so opening the page late still shows the right state instead of replaying from the start.
- **Live ETA.** A countdown ticks every second toward the estimated delivery time, softens to "Any moment now" as it runs out, and shows the absolute arrival time alongside it. Delivery fires a one-time confetti celebration.
- **Cancellation, gated correctly.** While the order is received or preparing, a Cancel action opens a reason-capture dialog; confirming writes the cancellation atomically and immediately stops the queued status timers so a later step can never quietly un-cancel it. Once the order is out for delivery the action is replaced by a plain explanation that it can no longer be cancelled.
- **A calm cancelled state.** A cancelled order gets its own screen: when it was cancelled, the reason, a refund note for prepaid orders, and clear "Order again" and "View orders" actions, rather than a broken timeline.
- **Always one tap away.** A global active-order banner surfaces any in-flight order on every page with a live status dot, its ETA and a Track shortcut. Discovery is cheap: it prefers the just-placed order already in Redux and otherwise does a single most-recent-order read, then holds one realtime subscription. It steps aside for the launcher on narrow screens, retires itself a few seconds after delivery, and never covers the page it is describing.

### Order history and reorder

- Order history renders four distinct states (first load, classified failure with retry, genuine empty, data) and never shows a spinner over cached data. Background revalidation is indicated separately.
- Reorder rebuilds the cart in one dispatch per line, skips items that are no longer resolvable, and reports how many were dropped.
- An order-detail modal shows the full bill, delivery address and contact for any past order, with keyboard focus trapping, Escape-to-close and scroll locking.

### Spending insights

A personal analytics dashboard at `/profile/insights`, computed entirely on the client from the user's own order history.

- **Two headline stats.** Total orders and total spent, with an average-per-order sub-line.
- **Monthly spend.** A line chart across the last six calendar months.
- **Favourite cuisines.** A donut chart of order share by dish category, top six.
- **Most ordered items.** A horizontal bar chart of the eight most-ordered dishes by quantity.
- Charts are rendered with Recharts, are theme-aware in both light and dark mode, use a colour palette chosen for colour-vision separation, and each falls back to its own empty state when there is nothing to plot.

### CraveAI assistant

A floating, resizable panel mounted globally, so the assistant is reachable from every page and survives navigation.

**Retrieval.** A precomputed menu summary document is fetched once, prefetched at app start and cached in `localStorage`, which keeps the assistant off the per-request Firestore read path entirely. Items are flattened and deduplicated on a composite `restaurantId::itemId` key.

**Ranking.** Queries are normalised, tokenised and stripped of stopwords, then scored against the catalogue with hard filters for vegetarian and non-vegetarian intent. A round-robin sample across restaurants plus a per-restaurant cap keeps the candidate pool diverse instead of returning five variations of the same dish from one kitchen.

**Generation.** The shortlist is passed to Llama 3.3 70B in JSON mode. Returned ids are resolved back to real menu items, so the assistant can never invent a dish that does not exist. Rate limits are retried with exponential backoff; a missing key or a network failure degrades to keyword ranking rather than an error message.

**Conversation.** Recent turns are replayed to the model as real conversation history, with previous dish carousels flattened into text so the model knows what it has already suggested. Constraints stated once carry forward, which means a follow-up like "something lighter" resolves correctly even though it contains no food term of its own. The model authors its own follow-up suggestions, rendered as one-tap chips on the newest turn only. Its replies are sanitised before display, including a guarantee that no em dashes reach the UI, so the assistant's voice stays consistent. The transcript is persisted to `localStorage` behind a bounded window, and a "new chat" control drops accumulated context.

**Handoff.** Selecting a dish closes the panel and navigates to that restaurant's menu with the dish as a query parameter. The menu opens the right category, scrolls the dish into view and highlights it as rendered state rather than by mutating class names from a timer.

### Theming

- **Class-based dark mode.** Tailwind `darkMode: 'class'` toggled on the document root, with an accessible switch (`role="switch"`, `aria-checked`) in the header.
- **No flash of the wrong theme.** A tiny blocking script in the document head applies the stored or system theme before the app bundle paints, so the first frame is already correct.
- **Preference, remembered.** The choice persists to `localStorage` and defaults to the operating system's `prefers-color-scheme`. Transitions are suppressed for a single frame during the switch, so toggling is instant rather than a wash of colour animations.

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
| Payments | Razorpay Checkout (UPI, card, net banking) with cash on delivery |
| Charts | Recharts 3 |
| Forms | React Hook Form with Yup schema resolvers |
| Styling | Tailwind CSS 3 with PostCSS, class-based dark mode |
| Animation | Anime.js 4 (scoped timelines, staggered entrances) |
| Notifications | react-toastify behind a thin wrapper |
| Bundler | Parcel 2 |

---

## Architecture

```
src/
  App.js                      Router, providers, theme, layout shell, skip link, AI prefetch
  containers/                 Route-level screens
    Body                      Restaurant catalogue: search, sort, filter, carousel
    RestaurantMenu            Menu with collapsible categories and AI deep-link handling
    Cart / Checkout           Cart review, order form, totals, payment, order creation
    OrderConfirmation         Post-order receipt with id-based fallback fetch
    OrderTracking             Live status timeline, ETA countdown, cancellation
    Profile                   Nested layout: account, orders, insights
    ProfileAccount            Editable profile details
    ProfileOrders             Order history and reorder
    ProfileInsights           Spending analytics dashboard (Recharts)
    Login / Signup            Validated auth flows
    Error / Offline           Route and connectivity fallbacks
  components/                 Presentational and composite UI
    Button, EmptyState, ErrorState, QuantityStepper, ThemeToggle, ...
    CraveAIAssistant          Floating, resizable, keyboard-operable chat panel
    ActiveOrderBanner         Global in-flight order strip with a Track shortcut
    CancelOrderModal          Reason-capture cancellation dialog
    OrderHistorySection, OrderDetailModal, ProfileHeader, ProfileActions
  utils/
    geminiService.js          Retrieval, ranking, prompt assembly, Groq call, fallbacks
    razorpayService.js        Razorpay SDK loading and checkout promise
    orderTrackingService.js   Status progression, delay model, timer scheduling, cancel
    orderUtils.js             Totals, order creation, status labels
    priceUtils.js             Single source of truth for unit price
    useInsightsData.js        Order history to chart-ready aggregates
    firestoreErrors.js        Error classification and user-facing copy
    authErrors.js             Firebase Auth error copy
    useOrderHistory.js        Cached, retry-aware order history query
    useRestaurantMenu.jsx     Cached menu query with not-found on the success path
    useAuthSync.js            Session rehydration at app root
    useLogout.js              One logout for the whole app
    useOnlineStatus.jsx       Connectivity
    useReducedMotion.js       Motion preference
    ThemeContext.jsx          Light/dark theme provider, persistence, system default
    Redux/                    Store and slices
```

**State ownership.** The split is deliberate. Anything the server owns lives in the query cache: restaurant lists, menus, order history. Anything the client owns lives in Redux: the cart, the session, the chat transcript, and the single order being confirmed. The order slice is intentionally minimal for the same reason. Mirroring the order list into Redux would create two sources of truth for the same data.

**Backend-free progression.** Order tracking advances without a server or a Cloud Function. `orderTrackingService.js` derives the timing from the restaurant's own delivery estimate and schedules the Firestore writes client-side, while the tracking screen reads them back live over `onSnapshot`. It is a deliberate portfolio-scale choice that still behaves correctly across refreshes and late visits, and the seam where a real backend would slot in (server-driven status writes) is isolated to that one module.

**Presentation layer.** Buttons, empty states, error states and avatars are centralised. Buttons in particular are generated from a closed set of variants and sizes, which replaced seventeen divergent spellings of the same control and fixed several submit buttons that had no visible focus style at all.

### Firestore data model

| Path | Contents |
| --- | --- |
| `restaurants_data/{doc}` | Restaurant catalogue snapshots |
| `menus/{restaurantId}` | Full menu for one restaurant |
| `users/{uid}` | Profile: name, email, phone, delivery address |
| `orders/{uid}/orders/{orderId}` | One order: items, totals, address, payment, tracking status and history, timestamps |
| `ai_index/global_menu_summary` | Precomputed, compact menu index for retrieval |

---

## Running locally

**Requirements:** Node.js 18 or newer, a Firebase project with Auth and Firestore enabled, a Groq API key, and a Razorpay key id (test mode is fine).

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

REACT_APP_RAZORPAY_KEY_ID=
```

`.env` is gitignored. No credentials are committed.

```bash
npm start     # development server on http://localhost:1234
npm run build # production bundle in dist/
```

The application degrades gracefully when optional keys are absent. Without a Groq key, CraveAI falls back to keyword-based ranking instead of failing. Without a Razorpay key, cash on delivery remains available as a complete checkout path.

---

## Engineering notes

A few decisions worth calling out, since they shaped most of the codebase:

**One source of truth per value.** Unit price, order totals and button styling each live in exactly one module. Before that consolidation the cart and the checkout disagreed on the delivery fee, and the confirmation screen read a field the order document did not have, so it displayed a bill whose lines did not add up to its own total.

**Pay first, then persist.** For online payments the order document is written only after Razorpay confirms the charge. A dismissed or failed payment leaves no order behind and keeps the cart intact, so the order collection never accumulates phantom unpaid records.

**A cancellation must stay cancelled.** Cancelling stops the queued status timers in the same breath as it writes the cancelled state. Without that, a timer scheduled earlier would later advance the order again and silently resurrect it, so the tracking scheduler also refuses to run for orders that are already cancelled or delivered.

**Empty is not an error.** A restaurant with no published menu, a user with no orders and a search with no matches are all valid outcomes. Each gets an empty state, not an error panel, and only genuine failures get the retry treatment.

**Loading, refreshing and failing are three different states.** Query hooks expose them separately, so a background revalidation shows a small indicator instead of replacing content the user is already reading.

**Interactive means interactive.** Menu accordions, sort options, AI dish cards and order cards were all clickable `div` elements at one point, which made ordering food impossible by keyboard. They are real buttons and inputs now, with the visual design unchanged.

**The AI cannot hallucinate inventory.** The model chooses from a shortlist and returns ids, which are resolved against the real catalogue before anything is rendered. That constraint is what makes the feature trustworthy enough to route users into a checkout flow.

---

## Author

**Awaze Shaikh**
[GitHub](https://github.com/awaze7) · [LinkedIn](https://www.linkedin.com/in/awazeshaikh7/)
