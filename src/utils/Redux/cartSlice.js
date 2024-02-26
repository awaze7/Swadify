import { createSlice } from "@reduxjs/toolkit";
// import { current } from "@reduxjs/toolkit";

const cartSlice = createSlice({
    name: "cart",
    initialState: {
        items: [],
        total: 0,
    },
    reducers: {
        addItem : (state, action) => {
            //mutating the state here
            // state.items.push(action.payload);
            const newItem = action.payload;

            // Check if the item already exists in the cart
            const existingItem = state.items.find(item => item.card.info.id === newItem.card.info.id);

            if (existingItem) {
                // If the item exists, increment its count
                existingItem.count += 1;
            } else {
                // If the item doesn't exist, add a new item to the cart
                state.items.push({ ...newItem, count: 1 });
            }
        },
        updateTotal: (state,action ) => {
            state.total = action.payload;
        },
        incrementItem : (state, action) => {
            const itemId = action.payload;
            const existingItem = state.items.find(item => item.card.info.id === itemId);

            if (existingItem) {
                existingItem.count += 1;
            }
        },
        decrementItem : (state, action) => {
            const itemId = action.payload;
            const existingItem = state.items.find(item => item.card.info.id === itemId);
 
            if (existingItem) {
                existingItem.count -= 1;
            }
        },
        removeItem : (state,action) => {
            // state.items.pop();
            // action.payload should contain the identifier of the item to be removed
            const itemIdToRemove = action.payload;
            state.items = state.items.filter((item) => item.card.info.id !== itemIdToRemove);
        },
        clearCart : (state) => {
            state.items.length = 0;
        }
    }
});

export const { addItem, removeItem, clearCart, incrementItem, decrementItem, updateTotal } = cartSlice.actions;

export default cartSlice.reducer;