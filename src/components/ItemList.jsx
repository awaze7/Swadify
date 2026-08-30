import { useDispatch, useSelector } from "react-redux";
import { addItem, incrementItem, decrementItem } from "../utils/Redux/cartSlice";
import { ITEM_IMG_CDN_URL } from "../utils/constants";
import { useState, useMemo, useCallback } from "react";
import { getUnitPrice } from "../utils/priceUtils";
import useCartConflict from "../utils/useCartConflict";
import QuantityStepper from "./QuantityStepper";
import CartConflictModal from "./CartConflictModal";

/**
 * Renders a list of menu items.
 *
 * `inCart`     – rendered inside the cart/checkout rather than a restaurant menu.
 * `readOnly`   – show quantities as static text with no controls (checkout review).
 * `restaurant` – `{ id, name }` of the menu these items belong to. Stamped onto
 *                each cart entry on add, because the cart is the only place that
 *                still knows where an item came from by the time checkout runs.
 *
 * The order-summary block and "Clear Cart" button that used to live at the bottom
 * of this component were removed: Cart.jsx and Checkout.jsx each render their own
 * summary from `calculateOrderTotals`, so the cart page was showing two summaries
 * with different delivery fees (₹25 here vs ₹40 there) and contradictory totals.
 * Totals now come from exactly one place.
 */
const ItemList = ({ items, inCart, readOnly, restaurant, highlightedDishId }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((store) => store.cart.items);
  const { conflict, guardedAdd, confirmReplace, cancel } = useCartConflict();

  // Tracks which descriptions the user has expanded via the "more" affordance.
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  // id -> count, so each row is an O(1) lookup instead of a scan of the cart.
  const cartItemMap = useMemo(
    () => new Map(cartItems.map((item) => [item.card.info.id, item.count])),
    [cartItems]
  );

  const expandDescription = useCallback((itemId) => {
    setExpandedDescriptions((prev) => ({ ...prev, [itemId]: true }));
  }, []);

  // Cart entries carry the restaurant they came from. Without this the order
  // written to Firestore had no way to name its restaurant — Checkout read
  // `cartItems[0].card.restaurantId`, which nothing ever set, so every single
  // order was persisted as "Unknown Restaurant".
  //
  // The add is routed through `guardedAdd`: a cart holds one restaurant's order
  // at a time, so if the cart already belongs to a different restaurant this
  // surfaces the confirm-and-replace modal instead of silently mixing the two.
  const handleAdd = useCallback(
    (item) => {
      const resId = restaurant?.id ?? item.card?.restaurantId ?? "";
      const resName = restaurant?.name ?? item.card?.restaurantName ?? "";
      const enriched = {
        ...item,
        card: {
          ...item.card,
          restaurantId: resId,
          restaurantName: resName,
          // Carried through so Checkout can set estimatedDelivery and drive
          // the order-tracking timer schedule from the real restaurant ETA.
          deliveryTimeMinutes:
            restaurant?.deliveryTimeMinutes ?? item.card?.deliveryTimeMinutes ?? 30,
        },
      };
      guardedAdd(resId, resName, () => dispatch(addItem(enriched)));
    },
    [dispatch, guardedAdd, restaurant?.id, restaurant?.name, restaurant?.deliveryTimeMinutes]
  );
  const handleIncrement = useCallback((itemId) => dispatch(incrementItem(itemId)), [dispatch]);
  // `decrementItem` removes the line itself when it reaches zero, so the UI
  // does not have to sequence a second `removeItem` dispatch.
  const handleDecrement = useCallback((itemId) => dispatch(decrementItem(itemId)), [dispatch]);

  return (
    <>
    <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
      {items.map((item) => {
        const info = item.card.info;
        const description = info.description || "";
        const isExpanded = expandedDescriptions[info.id];
        const isLongDescription = description.length > 80;
        const unitPrice = getUnitPrice(info);
        const count = inCart ? item.count : cartItemMap.get(info.id) || 0;
        const isHighlighted = String(info.id) === String(highlightedDishId);

        return (
          <li
            key={info.id}
            id={`dish-${info.id}`}
            // The highlight is a rendered prop, not a class mutated onto the
            // node from a timer, so React can never wipe it mid-animation.
            className={`flex items-start justify-between gap-4 rounded-lg py-4 text-left transition-colors duration-700 ${
              isHighlighted ? "bg-yellow-50 dark:bg-yellow-900/20 px-3 ring-2 ring-yellow-400" : ""
            }`}
          >
            {/* Names the reason this row is highlighted, instead of leaving the
                visual treatment as the only signal. */}
            {isHighlighted && (
              <span className="sr-only" role="status">
                {info.name}, the dish CraveAI suggested
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-base font-medium text-gray-900 dark:text-white">{info.name}</div>

              {unitPrice > 0 && (
                <div className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  ₹{unitPrice.toFixed(2)}
                </div>
              )}

              {description && (
                <div className="mt-1.5 text-sm font-normal text-gray-600 dark:text-zinc-400">
                  {isExpanded ? (
                    <p>{description}</p>
                  ) : (
                    <div className="flex flex-wrap items-baseline">
                      <p className="line-clamp-2">{description}</p>
                      {isLongDescription && (
                        <button
                          type="button"
                          onClick={() => expandDescription(info.id)}
                          className="ml-1 inline-block rounded font-semibold text-gray-900 dark:text-white underline decoration-gray-400 dark:decoration-gray-600 underline-offset-2 hover:decoration-gray-900 dark:hover:decoration-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                          aria-label={`Read full description of ${info.name}`}
                        >
                          more
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Checkout review: quantity and line total as plain text. */}
              {inCart && readOnly && (
                <div className="mt-2 text-sm text-gray-700 dark:text-zinc-300">
                  <span className="font-semibold tabular-nums">{item.count}</span>
                  <span className="mx-1 text-gray-400 dark:text-zinc-500">×</span>
                  <span className="tabular-nums">₹{unitPrice.toFixed(2)}</span>
                  <span className="mx-1.5 text-gray-400 dark:text-zinc-500">=</span>
                  <span className="font-semibold tabular-nums">
                    ₹{(unitPrice * item.count).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/*
              Image and control share one right-hand column. The control sits
              directly under the image in normal flow — it used to be
              absolutely positioned with hand-tuned top margins, which is what
              made it jump when switching between ADD and the stepper.
            */}
            <div className="flex w-28 flex-shrink-0 flex-col items-center gap-2 sm:w-36">
              {info.imageId && (
                <img
                  src={ITEM_IMG_CDN_URL + info.imageId}
                  alt={info.name}
                  loading="lazy"
                  className="h-20 w-full rounded-lg object-cover sm:h-24"
                />
              )}

              {!readOnly && (
                <QuantityStepper
                  count={count}
                  itemName={info.name}
                  size="compact"
                  onAdd={() => handleAdd(item)}
                  onIncrement={() => handleIncrement(info.id)}
                  onDecrement={() => handleDecrement(info.id)}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
    <CartConflictModal conflict={conflict} onCancel={cancel} onReplace={confirmReplace} />
    </>
  );
};

export default ItemList;
