// Conversational response variations
const SUCCESS_INTRO_TEMPLATES = [
  (count, query) => `Mmm, great craving! I found ${count} tasty ${query ? `matches for "${query}"` : 'dishes'} for you:`,
  (count, query) => `Here you go! ${count} delicious options ${query ? `for "${query}"` : 'that hit the spot'}:`,
  (count, query) => `Ooh, nice choice! Check out these ${count} recommendations:`,
  (count, query) => `I hunted down ${count} dishes that match your craving!`
];

const EMPTY_RESPONSES = [
  "Hmm, couldn't find anything matching that exact craving right now. Want to try searching for something else like 'Pizza' or 'Dosa'?",
  "Ah, nothing popped up for that! How about trying a different cuisine or dish name?",
  "I searched around, but couldn't spot that on the menu right now. What else are you in the mood for?"
];

const GREETING_RESPONSES = [
  "Hey there! Hungry? Tell me what you're craving today (e.g., 'Spicy Biryani' or 'Cold Coffee')!",
  "Hi! Ready for food? Let me know what you feel like eating!",
  "Hello! What are we eating today?"
];

/**
 * Helper to generate human-like response messages
 */
export const getConversationalAIResponse = (dishesCount, queryText = "") => {
  if (!queryText || queryText.trim() === "") {
    const randomIndex = Math.floor(Math.random() * GREETING_RESPONSES.length);
    return GREETING_RESPONSES[randomIndex];
  }

  if (dishesCount === 0) {
    const randomIndex = Math.floor(Math.random() * EMPTY_RESPONSES.length);
    return EMPTY_RESPONSES[randomIndex];
  }

  const randomIndex = Math.floor(Math.random() * SUCCESS_INTRO_TEMPLATES.length);
  return SUCCESS_INTRO_TEMPLATES[randomIndex](dishesCount, queryText);
};