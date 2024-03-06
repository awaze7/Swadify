import { useSelector } from "react-redux";
import ItemList from "../components/ItemList";
import { Link } from "react-router-dom";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";

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
                    <p className="text-gray-800 my-3 font-medium">Your cart is empty. Add items to the cart!</p>
                    <Link
                        to="/"
                        className="m-2 font-semibold text-base bg-blue-600 hover:bg-blue-700 px-3 py-1 text-white rounded-xl inline-block"
                        //m-2 font-semibold text-base bg-blue-600 hover:bg-blue-700 px-3 py-1 text-white rounded-lg
                    >
                        Home
                    </Link>
                </div>}

                <ItemList items={cartItems} inCart />
                
            </div>
        </div>
    )
}

export default Cart;