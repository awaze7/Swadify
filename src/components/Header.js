import Logo from '../utils/logo.png';
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart } from 'react-icons/fi';
import { auth } from '../firebase';
import { logOut,setLoading } from '../utils/Redux/userSlice';

const Header = () => {
    const dispatch= useDispatch();
    const user = useSelector((store) => store.user.user);
    const cartItems = useSelector((store) => store.cart.items);
    // console.log(cartItems);

    const handleLogout = () => {
        dispatch(logOut());
        dispatch(setLoading(true));
        auth.signOut();
    }

    return (
        <div className="flex justify-between shadow-lg bg-yellow-500">
            <div className="logo-container ml-10">
                <img className="w-32" src={Logo} alt="logo" />
            </div>
            <div className="flex items-center mr-10 font-semibold text-xl">
                <ul className="flex p-4 m-4">
                    
                    <li className="px-4">
                        <Link to="/">Home</Link>
                    </li>
                    <li className="px-4">
                        <Link to="/about">About</Link>
                    </li>
                    <li className="px-4">
                        <Link to="/contact">Contact</Link>
                    </li>
                    <li className="px-4">
                        <Link to="/cart" className="flex flex-row">

                        <div className="relative">
                            <FiShoppingCart size={26} color="#000" />
                            <span
                                className="absolute top-0 right-0 translate-y-[-0.50em] translate-x-[0.8em] text-base bg-yellow-500 rounded-full font-bold leading-tight"
                            >({cartItems.length})
                            </span>
                        </div>
                        </Link>
                    </li>
                    <li className="px-4">
                        {user? 
                        (
                            <button
                                className="logout"
                                onClick={handleLogout}
                            >
                            Logout
                            </button>
                        ) : 
                        (
                            <Link to="/login">
                            <button 
                                className="login" 
                            >
                            Login
                            </button>
                            </Link>
                        )
                        }
                    </li>
                    
                </ul>
            </div> 
        </div>
    )
}

export default Header;
