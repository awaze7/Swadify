import React from "react";
import { useState } from "react";
import SwadifyImg from "../utils/Swadify_img.png";
import { Link } from "react-router-dom";
import { auth } from "../firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useDispatch,useSelector } from "react-redux";
import { loginUser, setLoading } from "../utils/Redux/userSlice";
import { doc, setDoc } from "firebase/firestore";
import { db } from '../firebase';
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline.js";
import { toast } from "react-toastify";


const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [address, setAddress] = useState("");
    const dispatch = useDispatch();
    const onlineStatus = useOnlineStatus();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    
    const validatePhoneNumber = (phoneNumber) => {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phoneNumber);
    };
    
    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      
        if (!passwordRegex.test(password)) {
          let errors = [];
      
          if (password.length < 8) {
            errors.push('Password must be at least 8 characters long.');
          }
      
          if (!/(?=.*[a-z])/.test(password)) {
            errors.push('Password must contain at least one lowercase letter.');
          }
      
          if (!/(?=.*[A-Z])/.test(password)) {
            errors.push('Password must contain at least one uppercase letter.');
          }
      
          if (!/(?=.*\d)/.test(password)) {
            errors.push('Password must contain at least one digit.');
          }
      
          return errors;
        }
      
        return null; //valid Password
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validatePhoneNumber(phone)) {
            toast.error('Invalid phone number format',{
                position: "top-center",
                style: {
                  marginTop:'80px',
                },
            });
            return;
        }
        if (!validateEmail(email)) {
            toast.error('Invalid email format',{
                position: "top-center",
                style: {
                  marginTop:'80px',
                },
            });
            return;
        }
        const passwordErrors = validatePassword(password);
        if (passwordErrors) {
            // Handle password errors
            // alert(passwordErrors.join('\n'));
            toast.error(passwordErrors.join('\n'),{
                position: "top-center",
                style: {
                  marginTop:'80px',
                },
                autoClose: 2500,
            });
            return;
        }
        if(password !== confirmPassword) {
            toast.error('Passwords do not match',{
                position: "top-center",
                style: {
                  marginTop:'110px',
                },
            });
            return;
        }

        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await signInWithEmailAndPassword(auth, email, password);
            console.log("G")
            // Create a document in the 'users' collection with user data
            await setDoc(doc(db, 'users', user.uid), {
                displayName: name,
                email: email,
                phoneNumber: phone,
                address: address,
            });
        
            // Dispatch updated user data to Redux store
            dispatch(
                loginUser({
                uid: user.uid,
                email: user.email,
                displayName: name,
                address: address,
                phoneNumber: phone,
                })
            );
        
            // Set loading state to false
            dispatch(setLoading(false));
        
            toast.success("Signed up successfully",{
                style: {
                  backgroundColor: "black",
                  color: "white",
                  marginTop:'80px',
                },
              });
            console.log(user);
        } catch (error) {
            toast.error(error.message,{
                style: {
                  marginTop:'80px',
                },
            });
        }

    };

    if (!onlineStatus) {
        return <Offline />;
    }
      
    return (
    <div className="flex items-center justify-center lg:my-5 md:my-40 sm:my-10">
        <section className="flex flex-col md:flex-row justify-center space-y-10 md:space-y-0 md:space-x-16 items-center">
            <div className="md:w-2/5 max-w-base sm:max-w-lg">
                <img src={SwadifyImg} alt="Food image" />
            </div>
            <div className="md:w-2/5 max-w-sm">
                {/* md:w-1/3 everywhere old way */}
            <form onSubmit={handleSubmit}>
                <h1 className="text-center md:text-left text-2xl mb-4 font-semibold">
                    Sign Up
                </h1>
                <input
                    className="text-sm w-full px-4 py-1.5 border border-solid border-gray-400 rounded outline-none"
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    className="text-sm w-full px-4 py-1.5 border border-solid border-gray-400 rounded outline-none mt-4"
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                />
                <input
                    className="text-sm w-full px-4 py-1.5 border border-solid border-gray-400 rounded outline-none mt-4"
                    type="text"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    className="text-sm w-full px-4 py-1.5 border border-solid border-gray-400 rounded outline-none mt-4"
                    type="text"
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                />
                <input
                    className="text-sm w-full px-4 py-1.5 border border-solid border-gray-400 rounded outline-none mt-4"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <input
                    className="text-sm w-full px-4 py-2 border border-solid border-gray-400 rounded outline-none mt-4"
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <div className="text-center md:text-left">
                    <button
                    className="mt-4 bg-blue-600 hover:bg-blue-700 px-2 py-0.5 text-white uppercase rounded text-base tracking-wider"
                    type="submit"
                    >
                    Sign Up
                    </button>
                </div>            
            </form>
            <div className="mt-2 font-semibold text-sm text-slate-500 text-center md:text-left">
                  Don't have an account?{" "}
                    <Link
                        className="text-red-600 hover:underline hover:underline-offset-4"
                        to= "/login"
                    >
                    Login
                    </Link>
            </div>
          </div>
        </section>
    </div>        
    );
};

export default Signup;
