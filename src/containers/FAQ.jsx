import { useState } from "react";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const FAQ_CATEGORIES = [
  {
    category: "Orders & Delivery",
    items: [
      {
        q: "How do I track my order?",
        a: "Once your order is placed, you can track it from your profile page. You'll see real-time updates as your order moves from confirmed to preparing, out for delivery, and finally delivered. Click on any order to view detailed status information."
      },
      {
        q: "Can I cancel or modify my order?",
        a: "You can cancel your order before it's confirmed by the restaurant, typically within the first few minutes. Once preparation begins, cancellation may not be possible. To cancel, go to your profile, find the order, and select 'Cancel Order'. If the option isn't available, contact support immediately."
      },
      {
        q: "How long does delivery take?",
        a: "Delivery times vary by restaurant and your location, typically ranging from 30-60 minutes. You'll see an estimated delivery time before placing your order. Factors like weather, traffic, and order complexity can affect delivery times."
      },
      {
        q: "What if my order is late or incorrect?",
        a: "If your order is significantly delayed or arrives with missing or incorrect items, contact our support team immediately through the Contact page. We'll work with the restaurant to resolve the issue and, if necessary, provide a refund or reorder."
      },
      {
        q: "Is there a minimum order amount?",
        a: "Minimum order amounts vary by restaurant. You'll see any minimum requirements when browsing a restaurant's menu. Some restaurants may also have distance-based minimums for certain areas."
      },
    ]
  },
  {
    category: "Payment & Pricing",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "Currently, we accept Cash on Delivery (COD). We're actively working on adding more payment options including UPI, credit/debit cards, Paytm, Google Pay, and other digital wallets. These will be available soon."
      },
      {
        q: "Are there any delivery fees?",
        a: "Yes, delivery fees vary by restaurant and distance. The exact fee is shown during checkout before you place your order. Some restaurants may offer free delivery during promotional periods."
      },
      {
        q: "How are taxes and fees calculated?",
        a: "Your total includes the item price, applicable GST (5%), a platform fee (5%), and delivery charges. All fees are clearly itemized during checkout so you know exactly what you're paying."
      },
      {
        q: "Do you offer discounts or coupons?",
        a: "Many restaurants offer discounts that are displayed on their cards. We're working on implementing a comprehensive coupon system where you can apply promo codes at checkout for additional savings."
      },
    ]
  },
  {
    category: "Account & Profile",
    items: [
      {
        q: "Do I need an account to order?",
        a: "Yes, you need to create a free account to place orders. This allows us to save your addresses, track order history, and provide personalized recommendations through Crave AI."
      },
      {
        q: "How do I update my profile information?",
        a: "Go to your Profile page (click your avatar in the header), then click 'Edit Profile'. You can update your name, phone number, email, and default delivery address."
      },
      {
        q: "Can I save multiple delivery addresses?",
        a: "Currently, you can update your delivery address when placing an order. We're working on adding a saved addresses feature where you can store home, work, and other frequently used locations."
      },
      {
        q: "How do I reset my password?",
        a: "Click 'Login', then select 'Forgot Password'. Enter your registered email address and you'll receive a password reset link. If you don't receive it within a few minutes, check your spam folder."
      },
      {
        q: "Can I delete my account?",
        a: "Yes, contact our support team at info@swadify.com to request account deletion. We'll remove your personal information within 30 days, though we may retain some data as required by law."
      },
    ]
  },
  {
    category: "Crave AI Assistant",
    items: [
      {
        q: "What is the Crave AI assistant?",
        a: "Crave AI is your personal food assistant that helps you discover dishes, get recommendations based on your preferences, compare menu items, and answer questions about restaurants. Click the floating icon to start chatting."
      },
      {
        q: "How does Crave AI make recommendations?",
        a: "Crave AI uses information about restaurant menus, your order history, and your stated preferences to suggest dishes you might enjoy. It learns from your interactions to provide increasingly personalized suggestions."
      },
      {
        q: "Can Crave AI place orders for me?",
        a: "Currently, Crave AI helps you discover and learn about food, but you place orders through the normal flow. It can, however, guide you to specific dishes and restaurants to make ordering easier."
      },
      {
        q: "Is my conversation with Crave AI private?",
        a: "Yes, your Crave AI conversations are stored locally in your browser and used only to improve your experience. We don't share your chat history with third parties."
      },
    ]
  },
  {
    category: "Restaurants & Menus",
    items: [
      {
        q: "How do I search for specific dishes?",
        a: "Use the search bar on the home page to search for restaurants, cuisines, or dish names. You can also ask Crave AI to help you find specific items across all restaurant menus."
      },
      {
        q: "Are menu prices accurate?",
        a: "We work hard to keep menu prices up to date, but restaurants may change prices without notice. The price shown at checkout is always the final price you'll pay."
      },
      {
        q: "Can I filter for vegetarian options?",
        a: "Many restaurants mark vegetarian dishes with a green badge. We're working on adding comprehensive filters for vegetarian, vegan, and other dietary preferences."
      },
      {
        q: "How do I know if a restaurant is currently open?",
        a: "Restaurant operating hours are displayed on their menu page. If a restaurant is closed, you won't be able to place an order, but you can still browse their menu."
      },
      {
        q: "Can I leave reviews for restaurants?",
        a: "We're currently developing a review and rating system. Soon you'll be able to rate restaurants and dishes after your order is delivered."
      },
    ]
  },
  {
    category: "Technical Support",
    items: [
      {
        q: "The app isn't working properly. What should I do?",
        a: "Try refreshing the page first. If problems persist, clear your browser cache and cookies. If you're still experiencing issues, contact our support team with details about the problem and your browser/device."
      },
      {
        q: "Do I need to install anything?",
        a: "No, Swadify is a web application that works directly in your browser. No installation required. Just visit our website and start ordering."
      },
      {
        q: "Which browsers are supported?",
        a: "Swadify works best on modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, please use the latest version of your preferred browser."
      },
      {
        q: "Is there a mobile app?",
        a: "Currently, Swadify is a web application optimized for both desktop and mobile browsers. We're working on native mobile apps for iOS and Android."
      },
    ]
  },
];

const FAQ = () => {
  const onlineStatus = useOnlineStatus();
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (categoryIdx, itemIdx) => {
    const key = `${categoryIdx}-${itemIdx}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!onlineStatus) {
    return <Offline />;
  }

  return (
    <div className="mx-auto my-8 max-w-4xl px-4">
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg sm:p-10">
        <h1 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">Frequently Asked Questions</h1>
        <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
          Find answers to common questions about Swadify. Can't find what you're looking for?{' '}
          <a href="/contact" className="font-medium text-crave hover:underline">
            Contact us
          </a>
        </p>

        <div className="space-y-8">
          {FAQ_CATEGORIES.map((category, catIdx) => (
            <section key={catIdx}>
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">{category.category}</h2>
              <div className="space-y-3">
                {category.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isExpanded = expandedItems[key];
                  return (
                    <div key={itemIdx} className="rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700/30">
                      <button
                        onClick={() => toggleItem(catIdx, itemIdx)}
                        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-crave dark:focus-visible:ring-yellow-500 focus-visible:ring-inset"
                        aria-expanded={isExpanded}
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{item.q}</span>
                        {isExpanded ? (
                          <FaChevronUp className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <FaChevronDown className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4 pt-3">
                          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-lg bg-gray-50 dark:bg-gray-700/50 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Still have questions?</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Our support team is here to help. Reach out anytime.
          </p>
          <a
            href="/contact"
            className="inline-block rounded-lg bg-crave px-6 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-crave/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-crave focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
