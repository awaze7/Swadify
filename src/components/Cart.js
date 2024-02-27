import { useSelector } from "react-redux";
import ItemList from "./ItemList";
import { Link } from "react-router-dom";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline.js";

const Cart = () => {
    const cartItems = useSelector((store) => store.cart.items);

    const onlineStatus = useOnlineStatus();
    if (!onlineStatus) {
        return <Offline />;
    }
    return (
        <div className="text-center w-7/12 my-20 mx-auto px-6 py-4 rounded-lg shadow-lg min-h-full">
            <h1 className="text-3xl font-bold my-3">Your Cart</h1>

            <div className="m-auto">
                {cartItems.length === 0 && 
                <div>
                    <p className="text-gray-800 my-8 font-medium">Your cart is empty. Add items to the cart!</p>
                    <Link
                        to="/"
                        className="m-2 font-semibold text-base bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-white rounded-lg inline-block"
                        // "bg-green-500 mb-10 text-white py-2 px-4 mt-4 rounded-md shadow hover:bg-green-600 inline-block"
                    >
                        Go to Home
                    </Link>
                </div>}

                <ItemList items={cartItems} inCart />
                
            </div>
        </div>
    )
}

export default Cart;