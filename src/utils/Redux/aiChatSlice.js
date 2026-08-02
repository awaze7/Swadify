import { createSlice } from "@reduxjs/toolkit";

const initialMessages = (() => {
    try {
        const raw = localStorage.getItem('ai_chat_messages');
        if (raw) return JSON.parse(raw);
    } catch (e) {
        // ignore parse errors
    }
    return [{ role: 'assistant', content: 'How can I help you find a great meal today?', type: 'text' }];
})();

const aiChatSlice = createSlice({
    name: "aiChat",
    initialState: {
        isOpen: false,
        messages: initialMessages,
    },
    reducers: {
        toggleChat: (state) => {
            state.isOpen = !state.isOpen;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
            try { localStorage.setItem('ai_chat_messages', JSON.stringify(state.messages)); } catch(e) {}
        },
        setMessages: (state, action) => {
            state.messages = action.payload;
            try { localStorage.setItem('ai_chat_messages', JSON.stringify(state.messages)); } catch(e) {}
        },
        clearChat: (state) => {
            state.messages = [{ role: 'assistant', content: 'How can I help you find a great meal today?', type: 'text' }];
            try { localStorage.setItem('ai_chat_messages', JSON.stringify(state.messages)); } catch(e) {}
        }
    }
});

export const { toggleChat, addMessage, setMessages, clearChat } = aiChatSlice.actions;
export default aiChatSlice.reducer;