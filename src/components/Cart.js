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
        <div className="text-center w-7/12 mt-2 mb-8 mx-auto px-6 py-3 rounded-lg shadow-lg min-h-full">
            <h1 className="text-3xl font-bold my-3">Your Cart</h1>

            <div className="m-auto">
                {cartItems.length === 0 && 
                <div className="mb-6">
                    <p className="text-gray-800 my-6 font-medium">Your cart is empty. Add items to the cart!</p>
                    <Link
                        to="/"
                        className="m-2 font-semibold text-base bg-red-600 hover:bg-red-800 px-3 py-2 text-white rounded-3xl inline-block"
                        //m-2 font-semibold text-base bg-red-600 hover:bg-red-800 px-3 py-2 text-white rounded-3xl
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