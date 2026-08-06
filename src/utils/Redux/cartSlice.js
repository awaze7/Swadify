import { createSlice } from "@reduxjs/toolkit";
import { getCartItemUnitPrice } from "../priceUtils";

/**
 * Upper bound on a single line item. Guards against a stuck "+" (or a corrupt
 * reorder payload) pushing an absurd quantity through to Firestore. Enforced in
 * the reducer rather than the component so every entry point- the menu stepper,
 * the cart page and "Reorder" is capped identically.
 */
export const MAX_ITEM_QUANTITY = 20;

const clampCount = (count) => Math.min(Math.max(count, 0), MAX_ITEM_QUANTITY);

/**
 * `total` is the item subtotal, recomputed after every mutation.
 *
 * It used to be pushed in via a `dispatch(updateTotal(...))` call made from
 * ItemList's render body - a dispatch during render, which triggered an extra
 * render pass on every keystroke of cart activity. Deriving it here keeps Redux
 * internally consistent with zero component involvement.
 */
const recalculateTotal = (state) => {
  const subtotal = state.items.reduce(
    (sum, item) => sum + getCartItemUnitPrice(item) * (item.count || 0),
    0
  );
  state.total = parseFloat(subtotal.toFixed(2));
};

const findItem = (state, itemId) =>
  state.items.find((item) => item?.card?.info?.id === itemId);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    total: 0,
  },
  reducers: {
    /**
     * Adds an item, or bumps an existing line. Accepts an optional
     * `quantity` so "Reorder" can restore a line of 5 in one dispatch
     * instead of five separate ones.
     */
    addItem: (state, action) => {
      const newItem = action.payload;
      const info = newItem?.card?.info;
      if (!info?.id) return;

      const requested = Number(newItem.quantity ?? newItem.count ?? 1);
      const quantity = Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : 1;

      const existingItem = findItem(state, info.id);

      if (existingItem) {
        existingItem.count = clampCount(existingItem.count + quantity);
      } else {
        // Strip any transport-only `quantity` key so cart entries stay uniform.
        const { quantity: _ignored, ...rest } = newItem;
        state.items.push({ ...rest, count: clampCount(quantity) });
      }

      recalculateTotal(state);
    },

    incrementItem: (state, action) => {
      const existingItem = findItem(state, action.payload);
      if (!existingItem) return;
      existingItem.count = clampCount(existingItem.count + 1);
      recalculateTotal(state);
    },

    /**
     * Decrements a line, removing it entirely when it would hit zero. Folding
     * removal in here means the UI never has to sequence two dispatches (and can
     * never leave a `count: 0` ghost row behind if it forgets the second one).
     */
    decrementItem: (state, action) => {
      const itemId = action.payload;
      const existingItem = findItem(state, itemId);
      if (!existingItem) return;

      if (existingItem.count <= 1) {
        state.items = state.items.filter((item) => item?.card?.info?.id !== itemId);
      } else {
        existingItem.count -= 1;
      }

      recalculateTotal(state);
    },

    /** Sets an exact quantity; 0 or less removes the line. */
    setItemQuantity: (state, action) => {
      const { itemId, quantity } = action.payload || {};
      const existingItem = findItem(state, itemId);
      if (!existingItem) return;

      const next = clampCount(Math.floor(Number(quantity) || 0));
      if (next === 0) {
        state.items = state.items.filter((item) => item?.card?.info?.id !== itemId);
      } else {
        existingItem.count = next;
      }

      recalculateTotal(state);
    },

    removeItem: (state, action) => {
      state.items = state.items.filter((item) => item?.card?.info?.id !== action.payload);
      recalculateTotal(state);
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

export const {
  addItem,
  removeItem,
  clearCart,
  incrementItem,
  decrementItem,
  setItemQuantity,
} = cartSlice.actions;

export default cartSlice.reducer;
