import ReactDOM  from "react-dom/client";
import Header from "./components/Header";
import Body from "./components/Body.js";
import About from "./components/About";
import Contact from "./components/Contact.js";
import Error from "./components/Error.js";
import RestaurantMenu from "./components/RestaurantMenu.js";
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Provider } from "react-redux";
import appStore from "./utils/Redux/appStore.js";
import Cart from "./components/Cart.js";
import Footer from "./components/Footer.js";
import Login from "./components/Login.js";
import Signup from "./components/Signup.js";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
// import { useNavigate } from "react-router-dom";
// import useOnlineStatus from "./utils/useOnlineStatus.js";
// import Offline from "./components/Offline.js";
// import { useEffect } from "react";

const AppLayout = () => {
    // const onlineStatus = useOnlineStatus();
    // const navigate = useNavigate();

    // useEffect(() => {
    //     console.log("Online status: ", onlineStatus);
    //     if(!onlineStatus){
    //         navigate("/offline");
    //     }
    // }, [onlineStatus]);
    
    // {
    //     path: "/offline",
    //     element: <Offline />,
    // },

    return (
        <Provider store={appStore}>
            
                <div className="flex flex-col min-h-screen">
                    <ToastContainer autoClose={2500}/>
                    <Header />
                    <Outlet />
                    <Footer />
                </div>
                
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
                element: <About />,
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
