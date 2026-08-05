/**
 * Single source of truth for resolving a menu item's unit price.
 *
 * The upstream menu feed is inconsistent: some items carry `price`, some only
 * `defaultPrice`, and a few carry neither and instead embed the amount in the
 * item name ("Paneer Roll - Rs 180"). Cart display and checkout totals used to
 * implement different subsets of these fallbacks, so the cart could show a
 * price that the order total silently counted as 0. Everything now funnels here.
 */

const PRICE_IN_NAME = /(?:Rs\.?|₹|INR)\s*(\d+(?:\.\d+)?)/i;

export const extractPriceFromName = (name) => {
  if (typeof name !== "string") return 0;
  const match = name.match(PRICE_IN_NAME);
  return match ? parseFloat(match[1]) : 0;
};

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Resolves the unit price for a menu item's `card.info` payload.
 * Order of preference mirrors what the menu UI displays to the user.
 */
export const getUnitPrice = (info) => {
  if (!info) return 0;

  const candidates = [info.finalPrice, info.price, info.defaultPrice];
  for (const candidate of candidates) {
    const parsed = toFiniteNumber(candidate);
    // A genuine 0 is not a useful price here — fall through to the next source.
    if (parsed !== null && parsed > 0) return parsed;
  }

  return extractPriceFromName(info.name);
};

/** Convenience wrapper for a full cart entry (`{ card: { info }, count }`). */
export const getCartItemUnitPrice = (item) => getUnitPrice(item?.card?.info);

/** Whether we have any usable price for this item at all. */
export const hasResolvablePrice = (info) => getUnitPrice(info) > 0;
