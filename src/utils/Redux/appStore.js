import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import userReducer from "./userSlice";
import aiChatReducer from "./aiChatSlice";
import orderReducer from "./orderSlice";

const appStore = configureStore({
    reducer: {
        cart: cartReducer,
        user: userReducer,
        aiChat: aiChatReducer,
        orders: orderReducer,
    },
});

export default appStore;