import ReactDOM  from "react-dom/client";
import Header from "./components/Header";
import Body from "./containers/Body.js";
import About from "./containers/About";
import Contact from "./containers/Contact.js";
import Error from "./containers/Error.js";
import RestaurantMenu from "./containers/RestaurantMenu.js";
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Provider } from "react-redux";
import appStore from "./utils/Redux/appStore.js";
import Cart from "./containers/Cart.js";
import Footer from "./components/Footer.js";
import Login from "./containers/Login.js";
import Signup from "./containers/Signup.js";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Shimmer from "./components/Shimmer.js";
import RestaurantMenu from "./containers/RestaurantMenu.js";
import About from "./containers/About.js";


const AppLayout = () => {

    return (
        <Provider store={appStore}>
            
                <div className="flex flex-col min-h-screen">
                    <ToastContainer autoClose={1500}/>
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
