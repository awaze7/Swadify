import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import userReducer from "./userSlice";
import aiChatReducer from "./aiChatSlice";

const appStore = configureStore({
    reducer: {
        cart: cartReducer,
        user: userReducer,
        aiChat: aiChatReducer,
    },
});

export default appStore;