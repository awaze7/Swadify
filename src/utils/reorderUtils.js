/**
 * Pure helpers for the reorder / personalization surfaces.
 *
 * These take the raw order-history array (as returned by `useOrderHistory`) and
 * turn it into the exact shapes the existing UI already renders:
 *   - `rankReorderRestaurants` -> restaurant objects shaped like the cards in
 *     Body's `listOfRestaurants` (so `CarouselRestaurantCard`/`RestaurantCard`
 *     and the `/restaurants/:id` links work unchanged).
 *   - `frequentItemsForRestaurant` -> `itemCard`s shaped like a menu category's
 *     `itemCards` (so `ItemList` renders them with real price/image/stepper).
 *
 * Nothing here reads or writes anything; both are safe to call from a `useMemo`.
 */

// A stored order item carries `createdAt` as a Firestore Timestamp, a Date, or
// (defensively) a date string. Normalize to epoch ms for ranking; unknown or
// missing values sort last as 0.
const toTime = (value) => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

/**
 * Restaurants the user has ordered from, ranked most-recent first, limited to
 * the live list so every card links to a menu that actually resolves.
 *
 * @param {Array} orders            normalized order docs (newest first is fine, order-independent here)
 * @param {Array} liveRestaurants   Body's `listOfRestaurants` ([{ info: {...} }])
 * @param {number} limit            max cards to return
 * @returns {Array} subset of `liveRestaurants`, each with `{ orderCount, lastOrderedAt }`
 *                  merged onto `.info`, ranked by recency then frequency.
 */
export const rankReorderRestaurants = (orders, liveRestaurants, limit = 8) => {
  if (!orders?.length || !liveRestaurants?.length) return [];

  // Aggregate per restaurantId: how many orders, and the most recent timestamp.
  const stats = new Map();
  orders.forEach((order) => {
    const id = order?.restaurantId;
    if (!id) return;
    const at = toTime(order.createdAt);
    const prev = stats.get(id);
    if (prev) {
      prev.orderCount += 1;
      if (at > prev.lastOrderedAt) prev.lastOrderedAt = at;
    } else {
      stats.set(id, { orderCount: 1, lastOrderedAt: at });
    }
  });

  if (stats.size === 0) return [];

  // Index the live list once so lookups are O(1).
  const liveById = new Map(
    liveRestaurants
      .filter((r) => r?.info?.id != null)
      .map((r) => [String(r.info.id), r])
  );

  const ranked = [];
  stats.forEach((stat, id) => {
    const live = liveById.get(String(id));
    // Drop restaurants that are no longer in the catalogue: a card that links
    // to a menu we cannot load is worse than no card.
    if (!live) return;
    ranked.push({
      ...live,
      info: { ...live.info, orderCount: stat.orderCount, lastOrderedAt: stat.lastOrderedAt },
    });
  });

  ranked.sort((a, b) => {
    // Most recently ordered first; break ties by how often (the regular's spot).
    const byRecency = (b.info.lastOrderedAt || 0) - (a.info.lastOrderedAt || 0);
    if (byRecency !== 0) return byRecency;
    return (b.info.orderCount || 0) - (a.info.orderCount || 0);
  });

  return ranked.slice(0, limit);
};

/**
 * The dishes the user orders most at one restaurant, resolved against the live
 * menu so price, image and description are always current (and delisted items
 * are dropped rather than shown with a stale price).
 *
 * @param {Array}  orders          normalized order docs
 * @param {string} resId           restaurant id of the page being viewed
 * @param {Map}    menuItemsById   Map<string, itemCard> built from the live menu
 * @param {number} limit           max dishes to surface
 * @returns {Array} live `itemCard`s ({ card: { info } }), ranked by cumulative
 *                  quantity then recency, capped at `limit`.
 */
export const frequentItemsForRestaurant = (orders, resId, menuItemsById, limit = 6) => {
  if (!orders?.length || !resId || !menuItemsById || menuItemsById.size === 0) return [];

  const wanted = String(resId);

  // itemId -> { qty, lastOrderedAt }, summed across every order from this place.
  const stats = new Map();
  orders.forEach((order) => {
    if (String(order?.restaurantId) !== wanted) return;
    const at = toTime(order.createdAt);
    (order.items || []).forEach((item) => {
      const id = item?.itemId;
      if (id == null) return;
      const key = String(id);
      const qty = Number(item.quantity) || 1;
      const prev = stats.get(key);
      if (prev) {
        prev.qty += qty;
        if (at > prev.lastOrderedAt) prev.lastOrderedAt = at;
      } else {
        stats.set(key, { qty, lastOrderedAt: at });
      }
    });
  });

  if (stats.size === 0) return [];

  const matched = [];
  stats.forEach((stat, key) => {
    const itemCard = menuItemsById.get(key);
    // Only surface dishes still on the live menu; skip anything delisted.
    if (!itemCard) return;
    matched.push({ itemCard, qty: stat.qty, lastOrderedAt: stat.lastOrderedAt });
  });

  matched.sort((a, b) => {
    const byQty = b.qty - a.qty;
    if (byQty !== 0) return byQty;
    return (b.lastOrderedAt || 0) - (a.lastOrderedAt || 0);
  });

  return matched.slice(0, limit).map((m) => m.itemCard);
};
