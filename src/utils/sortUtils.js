/**
 * Extracts the minimum estimated delivery time in minutes from SLA strings or objects.
 * Examples: "30-35 mins" -> 30, "25 mins" -> 25
 */
export const getDeliveryTime = (restaurant) => {
  const sla = restaurant?.info?.sla;
  if (!sla) return 999;
  
  if (typeof sla.deliveryTime === 'number') return sla.deliveryTime;
  
  const slaString = sla.slaString || sla.header || "";
  const match = slaString.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
};

/**
 * Extracts numerical cost value for sorting.
 * Parses costForTwo strings like "₹150 for two" or numeric menu minimums.
 */
export const getRestaurantCost = (restaurant) => {
  const info = restaurant?.info;
  if (!info) return 0;

  // 1. If explicit minimum menu item price exists in dataset
  if (Array.isArray(info.menuItems) && info.menuItems.length > 0) {
    const minMenuPrice = Math.min(
      ...info.menuItems.map((item) => item.price || item.defaultPrice || Infinity)
    );
    if (minMenuPrice !== Infinity) return minMenuPrice / 100 || minMenuPrice;
  }

  // 2. Parse standard Swiggy costForTwo (e.g., "₹200 for two" or 20000 paise)
  const rawCost = info.costForTwo;
  if (typeof rawCost === 'number') {
    return rawCost > 1000 ? rawCost / 100 : rawCost;
  }

  if (typeof rawCost === 'string') {
    const numbers = rawCost.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const parsed = parseInt(numbers[0], 10);
      return parsed;
    }
  }

  return 0;
};

/**
 * Parses restaurant average rating to float.
 */
export const getRating = (restaurant) => {
  const rating = restaurant?.info?.avgRating;
  const parsed = parseFloat(rating);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Applies sorting algorithm based on selected option key.
 */
export const sortRestaurants = (restaurants, sortOption) => {
  const listCopy = [...restaurants];

  switch (sortOption) {
    case "deliveryTime":
      return listCopy.sort((a, b) => getDeliveryTime(a) - getDeliveryTime(b));

    case "rating":
      return listCopy.sort((a, b) => getRating(b) - getRating(a));

    case "costLowToHigh":
      return listCopy.sort((a, b) => getRestaurantCost(a) - getRestaurantCost(b));

    case "costHighToLow":
      return listCopy.sort((a, b) => getRestaurantCost(b) - getRestaurantCost(a));

    case "relevance":
    default:
      return listCopy;
  }
};