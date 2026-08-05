import React, { useEffect } from "react";
import ReactDOM  from "react-dom/client";
import Header from "./components/Header";
import Body from "./containers/Body";
import About from "./containers/About";
import Contact from "./containers/Contact";
import Error from "./containers/Error";
import RestaurantMenu from "./containers/RestaurantMenu";
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Provider } from "react-redux";
import appStore from "./utils/Redux/appStore";
import Cart from "./containers/Cart";
import Footer from "./components/Footer";
import Login from "./containers/Login";
import Signup from "./containers/Signup";
import CraveAIAssistant from "./components/CraveAIAssistant";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import Profile from "./containers/Profile";
import Checkout from "./containers/Checkout";
import OrderConfirmation from "./containers/OrderConfirmation";
import useAuthSync from "./utils/useAuthSync";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Per-query hooks override these where they need different behaviour.
            refetchOnWindowFocus: false,
            staleTime: 30_000,
        },
    },
});

const AppLayout = () => {
    // Rehydrates the Redux user from the persisted Firebase session on every load.
    useAuthSync();

    useEffect(() => {
        // Prefetch the compact AI menu summary and cache it in localStorage to minimize reads.
        const fetchSummary = async () => {
            try {
                const ref = doc(db, 'ai_index', 'global_menu_summary');
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const json = JSON.stringify(snap.data());
                    try { localStorage.setItem('ai_global_menu_summary', json); } catch (e) {}
                }
            } catch (err) {
                console.warn('Could not prefetch ai_global_menu_summary', err);
            }
        }
        fetchSummary();
    }, []);

    return (
        <div className="flex flex-col min-h-screen overflow-x-hidden w-full">
            <ToastContainer autoClose={1500} />
            {/*
              The actual skip link. `<main id="main-content">` already existed with
              a comment claiming keyboard users could skip to content, but nothing
              ever linked to that anchor — so every page still required tabbing
              through the whole header and nav. Visible only once focused.
            */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gray-900 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
                Skip to main content
            </a>
            <Header />
            {/* Named landmark so keyboard users can skip straight to page content. */}
            <main id="main-content" className="flex-grow">
                <Outlet />
            </main>
            <CraveAIAssistant />
            <Footer />
        </div>
    )
}

const appRouter = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            {
                path: "/",
                element: <Body />,
            },
            {
                path: "/contact",
                element: <Contact />,
            },
            {
                path: "/about",
                element : <About />,
            },
            {
                path: "/restaurants/:resId",
                element: <RestaurantMenu />,
            },
            {
                path: "/cart",
                element: <Cart />,
            },
            {
                path: "/checkout",
                element: <Checkout />,
            },
            {
                path: "/order-confirmation/:orderId",
                element: <OrderConfirmation />,
            },
            {
                path: "/profile",
                element: <Profile />,
            },
            {
                path: "/login",
                element: <Login />,
            },
            {
                path: "/signup",
                element: <Signup />,
            },
            {
                path: "*",
                element: <Error />,
            }
        ],
    },
])

const root = ReactDOM.createRoot(document.getElementById("root"));

/*
 * Providers sit above RouterProvider so that a single store and query cache span
 * the whole app. They used to live inside AppLayout, which meant anything the
 * router rendered outside that layout (the errorElement, for instance) had no
 * access to Redux, and hooks like useAuthSync had nowhere to mount.
 */
root.render(
    <Provider store={appStore}>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={appRouter} />
        </QueryClientProvider>
    </Provider>
);