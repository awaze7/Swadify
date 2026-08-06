import { createSlice } from "@reduxjs/toolkit";

/**
 * `currentOrder`: the order just placed, read by the confirmation screen. It is
 * written with dates pre-serialised to ISO strings, since Redux state must stay
 * serialisable.
 *
 * Nothing else about orders lives here. A user's order list is server state
 * owned by the `useOrderHistory` TanStack Query cache, and the order open in the
 * detail modal is local UI state. Mirroring either into Redux meant two sources
 * of truth for the same data and no rule for which one won.
 */
const orderSlice = createSlice({
    name: "orders",
    initialState: {
        currentOrder: null,
    },
    reducers: {
        setCurrentOrder: (state, action) => {
            state.currentOrder = action.payload;
        },
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
        },
    },
});

export const { setCurrentOrder, clearCurrentOrder } = orderSlice.actions;

export default orderSlice.reducer;
