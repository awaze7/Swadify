
import Logo from "../utils/Logo.png";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart } from 'react-icons/fi';
import { auth } from '../firebase';
import { logOut, setLoading } from '../utils/Redux/userSlice';
import { useState } from 'react';
import { toast } from 'react-toastify';

const Header = () => {
    const dispatch = useDispatch();
    const user = useSelector((store) => store.user.user);
    const cartItems = useSelector((store) => store.cart.items);

    const handleLogout = () => {
        dispatch(logOut());
        dispatch(setLoading(true));
        auth.signOut();
        toast.success("Logged out successfully",{
            style: {
              marginTop:'110px',
            },
        });
    }

    const [menuOpen, setMenuOpen] = useState(false);
    const [isCartHovered, setCartHovered] = useState(false);

    return (
        <div className="bg-yellow-300 shadow-lg font-mono">
            <div className="flex justify-between items-center mx-4">
                <div className="logo-container">
                    <img className="w-20 md:w-32" src={Logo} alt="logo" />
                </div>
                <div className="hidden md:flex items-center space-x-8">
                    <ul className="flex p-4 m-4 justify-evenly space-x-12 text-2xl font-medium">
                        <li className="hover:text-purple-500">
                            <Link to="/">Home</Link>
                        </li>
                        <li className="hover:text-purple-500">
                            <Link to="/about">About</Link>
                        </li>
                        <li className="hover:text-purple-500">
                            <Link to="/contact">Contact</Link>
                        </li>
                        <li className="hover:text-purple-500"
                            onMouseEnter={() => setCartHovered(true)}
                            onMouseLeave={() => setCartHovered(false)}
                        >
                            <Link to="/cart" className="flex flex-row">
                                <div className="relative">
                                    <FiShoppingCart size={26} color={isCartHovered ? "#8B5CF6" : "#000"} />
                                    <span className="absolute top-0 right-0 translate-y-[-0.50em] translate-x-[0.8em] text-base bg-yellow-300 rounded-full font-bold leading-tight">
                                        ({cartItems.length})
                                    </span>
                                </div>
                            </Link>
                        </li>
                        <li className="hover:text-purple-500">
                            {user ?
                                (
                                    <span
                                        className="logout cursor-pointer"
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </span>
                                ) :
                                (
                                    <Link to="/login">
                                        Login
                                    </Link>
                                )
                            }
                        </li>
                    </ul>
                </div>
                <div className="md:hidden">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        id="menu-button"
                        className="h-6 w-6 cursor-pointer block"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </div>
            </div>

            {menuOpen && (
                <div className="md:hidden">
                    <ul className="flex flex-col items-center space-y-4 text-xl mb-4">
                        <li className="hover:text-purple-500">
                            <Link to="/">Home</Link>
                        </li>
                        <li className="hover:text-purple-500">
                            <Link to="/about">About</Link>
                        </li>
                        <li className="hover:text-purple-500">
                            <Link to="/contact">Contact</Link>
                        </li>
                        <li className="hover:text-purple-500">
                            <Link to="/cart">
                                {/* <FiShoppingCart size={26} color="#000" /> */}
                                <span className="ml-2">
                                    Cart({cartItems.length})
                                </span>
                            </Link>
                        </li>
                        <li className="hover:text-purple-500">
                            {user ?
                                (
                                    <span
                                        className="logout cursor-pointer"
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </span>
                                ) :
                                (
                                    <Link to="/login">
                                        Login
                                    </Link>
                                )
                            }
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}

export default Header;
