import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = 'ai_chat_messages';

// The transcript is now sent to the model as conversation history, and it is
// mirrored into localStorage on every message. Both of those grow without bound
// otherwise, a long-lived chat could accumulate hundreds of turns and push
// past the localStorage quota, at which point every future write fails and
// persistence silently stops. Keeping a recent window is enough: only the last
// few turns are ever sent to the model anyway.
const MAX_STORED_MESSAGES = 50;

const GREETING = {
    role: 'assistant',
    content: "Hey! Tell me what you're in the mood for and I'll find it.",
    type: 'text',
};

const persist = (messages) => {
    try {
        // `transient` messages are client-side failure notices, not part of the
        // conversation. They stay in memory so the user sees them this session,
        // but persisting them would resurrect a stale "something went wrong" on
        // the next visit, above a transcript that had actually worked.
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(messages.filter((msg) => !msg?.transient))
        );
    } catch (e) {
        // Quota or private-mode errors are non-fatal — the chat still works
        // in memory for this session.
    }
};

const trim = (messages) =>
    messages.length > MAX_STORED_MESSAGES
        ? messages.slice(-MAX_STORED_MESSAGES)
        : messages;

const initialMessages = (() => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            // Guard the shape rather than trusting whatever is in storage: a
            // truncated or hand-edited value would otherwise reach the message
            // list and crash the render.
            if (Array.isArray(parsed) && parsed.length > 0) return trim(parsed);
        }
    } catch (e) {
        // ignore parse errors
    }
    return [GREETING];
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
        /**
         * Explicit close, as distinct from `toggleChat`. Used when an action
         * inside the panel navigates the user somewhere they now need to see —
         * a toggle would be wrong there, because it would *open* the panel if
         * it somehow wasn't already open.
         */
        closeChat: (state) => {
            state.isOpen = false;
        },
        addMessage: (state, action) => {
            // Follow-up chips belong to the newest turn only. Stripping them
            // from earlier messages keeps stale suggestions from stacking up
            // down the transcript, where tapping one would answer a turn that
            // has long since scrolled out of view.
            state.messages.forEach((msg) => {
                if (msg.followUps) delete msg.followUps;
            });
            state.messages.push(action.payload);
            state.messages = trim(state.messages);
            persist(state.messages);
        },
        setMessages: (state, action) => {
            state.messages = trim(action.payload);
            persist(state.messages);
        },
        clearChat: (state) => {
            state.messages = [GREETING];
            persist(state.messages);
        }
    }
});

export const { toggleChat, closeChat, addMessage, setMessages, clearChat } = aiChatSlice.actions;
export default aiChatSlice.reducer;
