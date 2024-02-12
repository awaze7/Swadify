import Logo from '../utils/logo.png';
import { useState } from "react";
import { Link } from "react-router-dom";
import useOnlineStatus from '../utils/useOnlineStatus';
import { CART_ICON } from "../utils/constants";

const Header = () => {
    const [btnName, setBtnName] = useState("Login");
    // console.log("Header render");

    const onlineStatus = useOnlineStatus();

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
                    
                    <li className="px-2">
                        <img
                            src={CART_ICON}
                            alt="Cart Icon"
                        />
                    </li>
                    <button 
                        className="login" 
                        onClick={()=>{ 
                            btnName==="Login"?
                            setBtnName("Logout"):
                            setBtnName("Login");
                        }}
                    >
                        {btnName}{onlineStatus ? " 🟢" : " 🔴"}
                    </button>
                </ul>
            </div> 
        </div>
    )
}

export default Header;