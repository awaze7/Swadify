import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiTrash2, FiArrowRight } from "react-icons/fi";
import ItemList from "../components/ItemList";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";
import { calculateOrderTotals } from "../utils/orderUtils";
import { clearCart } from "../utils/Redux/cartSlice";
import Button, { buttonClasses } from "../components/Button";

const Cart = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const cartItems = useSelector((store) => store.cart.items);
    const user = useSelector((store) => store.user.user);

    const onlineStatus = useOnlineStatus();
    if (!onlineStatus) {
        return <Offline />;
    }

    const { totalItems, itemSubtotal, gst, platformFee, deliveryFee, total } =
        calculateOrderTotals(cartItems);

    const handleCheckout = () => {
        if (!user) {
            // Preserve intent so login can bounce the user straight to checkout.
            navigate("/login", { state: { from: "/checkout" } });
            return;
        }
        navigate("/checkout");
    };

    if (cartItems.length === 0) {
        return (
            <div className="mx-auto w-full max-w-lg px-4 pb-28 pt-12 sm:pt-16">
                <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                        <FiShoppingCart className="text-gray-400" size={34} aria-hidden="true" />
                    </div>
                    <h1 className="mt-6 text-2xl font-bold text-gray-900">Your cart is empty</h1>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
                        Browse restaurants near you and add a few dishes — they'll show up right here.
                    </p>
                    <Link to="/" className={buttonClasses({ size: "lg", className: "mt-7" })}>
                        Browse restaurants
                        <FiArrowRight size={18} aria-hidden="true" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-8">
            <div className="mb-6 flex items-baseline justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Your Cart</h1>
                <p className="text-sm text-gray-600">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Items */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 shadow-sm sm:px-6">
                        <ItemList items={cartItems} inCart />
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button
                            variant="dangerSubtle"
                            size="sm"
                            onClick={() => dispatch(clearCart())}
                        >
                            <FiTrash2 size={16} aria-hidden="true" />
                            Clear cart
                        </Button>
                    </div>
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm lg:sticky lg:top-24">
                        <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

                        <dl className="mt-4 space-y-2.5">
                            <div className="flex justify-between text-sm text-gray-700">
                                <dt>Item total</dt>
                                <dd className="tabular-nums">₹{itemSubtotal.toFixed(2)}</dd>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <dt>GST (5%)</dt>
                                <dd className="tabular-nums">₹{gst.toFixed(2)}</dd>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <dt>Platform fee (5%)</dt>
                                <dd className="tabular-nums">₹{platformFee.toFixed(2)}</dd>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-2.5 text-sm text-gray-700">
                                <dt>Delivery fee</dt>
                                <dd className="tabular-nums">₹{deliveryFee.toFixed(2)}</dd>
                            </div>
                            <div className="flex justify-between rounded-lg bg-white px-3 py-2.5 text-base font-bold text-gray-900 ring-1 ring-gray-200">
                                <dt>Grand total</dt>
                                <dd className="tabular-nums">₹{total.toFixed(2)}</dd>
                            </div>
                        </dl>

                        <Button
                            fullWidth
                            size="lg"
                            onClick={handleCheckout}
                            className="mt-5"
                        >
                            {user ? "Proceed to Checkout" : "Login to Checkout"}
                            <FiArrowRight size={18} aria-hidden="true" />
                        </Button>

                        <Link
                            to="/"
                            className="mt-3 block rounded-lg py-2 text-center text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                        >
                            Add more items
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
