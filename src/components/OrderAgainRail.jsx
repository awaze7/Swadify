import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import useOrderHistory from "../utils/useOrderHistory";
import { rankReorderRestaurants } from "../utils/reorderUtils";
import CarouselRestaurantCard, { withCarouselVegLabel } from "./CarouselRestaurantCard";

const CarouselCardWithVegLabel = withCarouselVegLabel(CarouselRestaurantCard);

/**
 * "Order again" — a horizontal row of the restaurants the signed-in user has
 * actually ordered from, most recent first. Each card links to the menu, where
 * the `FrequentlyOrdered` accordion takes over the dish-level reorder.
 *
 * Restaurant-level (not dish-level) on purpose: the home page never loads any
 * individual menu, so a restaurant link is the only reorder affordance that can
 * be guaranteed to resolve. It renders `null` for signed-out users, while
 * history loads, and when nothing maps to a live restaurant — so it never
 * leaves an empty shell or shifts the layout.
 *
 * `restaurants` is Body's already-fetched `listOfRestaurants`; we reuse it as
 * the source of truth for live cards rather than issuing another read.
 */
const OrderAgainRail = ({ restaurants }) => {
  const user = useSelector((store) => store.user.user);
  const { orders, isLoading } = useOrderHistory(user?.uid);

  const ranked = useMemo(
    // Kept intentionally short: "Order again" is a quick shortcut for a
    // returning user's most recent haunts, not a second catalogue. Two cards
    // reads as a nudge; a full row competes with the grid below it.
    () => rankReorderRestaurants(orders, restaurants, 2),
    [orders, restaurants]
  );

  if (!user || isLoading || ranked.length === 0) return null;

  return (
    <section aria-labelledby="order-again-heading" className="mb-8">
      <h2
        id="order-again-heading"
        className="mb-1 text-2xl font-bold text-gray-900 dark:text-white"
      >
        Order again
      </h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-zinc-400">
        Your most recent restaurants
      </p>

      {/* A plain scrollable strip, never auto-animated — the marquee treatment
          belongs to the hero carousel, not a utility shortcut row. */}
      <ul className="flex gap-6 overflow-x-auto pb-2">
        {ranked.map((restaurant) => {
          const { id, veg, orderCount } = restaurant.info;
          return (
            <li key={`order-again-${id}`} className="shrink-0">
              <Link
                to={"/restaurants/" + id}
                className="block rounded-2xl transition-transform duration-300 hover:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
              >
                {veg ? (
                  <CarouselCardWithVegLabel resData={restaurant} />
                ) : (
                  <CarouselRestaurantCard resData={restaurant} />
                )}
              </Link>
              <p className="mt-1.5 px-1 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                {orderCount === 1 ? "Ordered once" : `Ordered ${orderCount} times`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default OrderAgainRail;
