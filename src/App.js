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

const queryClient = new QueryClient();

const AppLayout = () => {
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
        <Provider store={appStore}>
            {/* 3. Wrap everything inside QueryClientProvider so Body.jsx can use useQuery */}
            <QueryClientProvider client={queryClient}>
                <div className="flex flex-col min-h-screen overflow-x-hidden w-full">
                    <ToastContainer autoClose={1500}/>
                    <Header />
                    <Outlet />
                    <CraveAIAssistant />
                    <Footer />
                </div>
            </QueryClientProvider>
        </Provider>
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
root.render(<RouterProvider router={appRouter} />);