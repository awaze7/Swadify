import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import useOrderHistory from "../utils/useOrderHistory";
import { frequentItemsForRestaurant } from "../utils/reorderUtils";
import ItemList from "./ItemList";

/**
 * "Frequently ordered" — the dishes the signed-in user orders most at THIS
 * restaurant, shown as its own accordion above the menu categories. It reuses
 * `ItemList` (and therefore the real `QuantityStepper`), so prices, images and
 * add-to-cart behave exactly like the rest of the menu; passing `restaurant`
 * means adds stamp the same `restaurantId`/`restaurantName`/ETA a normal menu
 * add would.
 *
 * Sits outside the menu's single-open `showIndex` group (own `open` state), so
 * expanding or collapsing it never disturbs the category accordions or the
 * `dishId` deep-link. Renders `null` for signed-out users, while history loads,
 * and when no ordered dish still exists on the live menu.
 *
 * @param {string} resId          the restaurant being viewed
 * @param {object} restaurant     `{ id, name, deliveryTimeMinutes }` identity for cart stamping
 * @param {Map}    menuItemsById  Map<itemId, itemCard> built from the live menu
 */
const FrequentlyOrdered = ({ resId, restaurant, menuItemsById }) => {
  const user = useSelector((store) => store.user.user);
  const { orders, isLoading } = useOrderHistory(user?.uid);
  const [open, setOpen] = useState(true);

  const items = useMemo(
    () => frequentItemsForRestaurant(orders, resId, menuItemsById, 6),
    [orders, resId, menuItemsById]
  );

  if (!user || isLoading || items.length === 0) return null;

  const panelId = "frequently-ordered-panel";

  return (
    <section
      aria-labelledby="frequently-ordered-heading"
      className="mx-3 my-3 rounded-xl border border-yellow-300 dark:border-yellow-500/40 bg-yellow-50/70 dark:bg-yellow-900/10 px-4 py-2 shadow-sm"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 rounded-lg py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
      >
        <span className="flex flex-col">
          <span
            id="frequently-ordered-heading"
            className="text-base font-bold text-gray-900 dark:text-white"
          >
            Your recent favourites
          </span>
          <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">
            Quick add from your last orders here
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`inline-block flex-shrink-0 text-2xl leading-none text-gray-700 dark:text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          &#9662;
        </span>
      </button>

      {open && (
        <div id={panelId}>
          <ItemList items={items} restaurant={restaurant} />
        </div>
      )}
    </section>
  );
};

export default FrequentlyOrdered;
