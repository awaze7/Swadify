import Logo from '../utils/logo.png';
import { useState } from "react";
import { Link } from "react-router-dom";
import useOnlineStatus from '../utils/useOnlineStatus';

const Header = () => {
    const [btnName, setBtnName] = useState("Login");
    // console.log("Header render");

    const onlineStatus = useOnlineStatus();

    return (
        <div className="header">
            <div className="logo-container">
                <img className="logo" src={Logo} alt="logo" />
            </div>
            <div className="nav-items">
                <ul>
                    
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/about">About</Link>
                    </li>
                    <li>
                        <Link to="/contact">Contact</Link>
                    </li>
                    <li>
                        Cart
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