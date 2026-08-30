import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "./Redux/cartSlice";

/**
 * Enforces the "one restaurant per cart" rule that every mainstream food app
 * holds: a cart is a single restaurant's order, so pulling in a dish from a
 * different restaurant is an explicit, confirmed reset rather than a silent mix.
 *
 * Usage: call `guardedAdd(restaurantId, restaurantName, perform)` from any add
 * entry point. When the cart is empty or already belongs to that restaurant it
 * runs `perform` straight away; otherwise it stashes `perform` and surfaces a
 * `conflict` object for `CartConflictModal` to render. Confirming clears the
 * cart and then runs the stashed action.
 *
 * The decision reads the restaurant off the existing cart entries (every entry
 * is stamped with `card.restaurantId`/`card.restaurantName` on add), so it needs
 * no extra store slice or read.
 */
const useCartConflict = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((store) => store.cart.items);
  const [conflict, setConflict] = useState(null);

  const guardedAdd = useCallback(
    (nextRestaurantId, nextRestaurantName, perform) => {
      const current = cartItems[0]?.card;
      const currentId = current?.restaurantId ?? "";
      const currentName = current?.restaurantName ?? "";

      // No clash when the cart is empty, or it already belongs to this
      // restaurant. Compare by id when both sides carry one (the reliable key),
      // and fall back to name for any legacy entry written before ids were
      // stamped.
      const sameRestaurant =
        !current ||
        (currentId && nextRestaurantId
          ? String(currentId) === String(nextRestaurantId)
          : currentName === nextRestaurantName);

      if (sameRestaurant) {
        perform();
        return;
      }

      setConflict({ currentName, nextName: nextRestaurantName, perform });
    },
    [cartItems]
  );

  const confirmReplace = useCallback(() => {
    if (!conflict) return;
    // Empty the cart first so the stashed add lands on a clean slate, then
    // dismiss the modal. Redux dispatches apply synchronously in order.
    dispatch(clearCart());
    conflict.perform();
    setConflict(null);
  }, [conflict, dispatch]);

  const cancel = useCallback(() => setConflict(null), []);

  return { conflict, guardedAdd, confirmReplace, cancel };
};

export default useCartConflict;
