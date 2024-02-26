import React, { useState } from "react";
import { Link } from "react-router-dom";
import SwadifyImg from "../utils/Swadify_img.png";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useDispatch } from "react-redux";
import { loginUser,setLoading } from "../utils/Redux/userSlice";
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase';
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline.js";



const Login = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const onlineStatus = useOnlineStatus();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted");

    try {
      // Sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Dispatch user data to Redux store
        dispatch(
          loginUser({
            uid: user.uid,
            email: user.email,
            displayName: userData.displayName,
            address: userData.address,
            phoneNumber: userData.phoneNumber,
          })
        );

        // Set loading state to false
        dispatch(setLoading(false));

        console.log("User logged in successfully");
      } else {
        console.error("User data not found in Firestore");
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  if (!onlineStatus) {
    return <Offline />;
  }  
  return (
    <div className="flex items-center justify-center my-auto">
    <section className="flex flex-col md:flex-row justify-center space-y-10 md:space-y-0 md:space-x-16 items-center mx-5 md:mx-0">
        <div className="md:w-1/3 max-w-base">
            <img src={SwadifyImg} alt="Food image" />
        </div>
        <div className="md:w-1/3 max-w-sm">
        <form onSubmit={handleSubmit}>
          <h1 className="text-center md:text-left text-2xl my-4 font-semibold">
            Login
          </h1>
          <input
            className="text-sm w-full px-4 py-2 border border-solid border-gray-400 rounded outline-none mt-4"
            type="text"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="text-sm w-full px-4 py-2 border border-solid border-gray-400 rounded outline-none mt-4"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="text-center md:text-left">
            <button
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white uppercase rounded text-xs tracking-wider"
              type="submit"
            >
              Login
            </button>
          </div>
        </form>
        <div className="mt-4 font-semibold text-base text-slate-500 text-center md:text-left">
                  Already have an account?{" "}
                    <Link
                        className="text-red-600 hover:underline hover:underline-offset-4"
                        to="/signup"
                    >
                    Signup
                    </Link>
        </div>
      </div>
    </section>
  </div>
  );
};

export default Login;