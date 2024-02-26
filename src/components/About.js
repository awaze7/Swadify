import React, { useContext,useEffect } from 'react';
import User from './User';
import { useSelector } from 'react-redux';
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline.js";

const About = () => {

  const user = useSelector((store) => store.user.user)
  console.log(user);
  const userName = useSelector((store) => store.user?.user?.displayName || "User")
  // console.log(userName);

  const onlineStatus = useOnlineStatus();
  
  if (!onlineStatus) {
      return <Offline />;
  }
  return (
    <div className="max-w-5xl mx-auto p-6 my-14 rounded-lg shadow-lg bg-white">
      <h2 className="text-4xl font-bold mb-4 text-center">About Swadify</h2>
      <h3>Hello <span className="font-semibold">{userName}!</span></h3>
      <p className="text-gray-800 mb-6 ">
        Welcome to Swadify - your go-to platform for exploring and enjoying delicious meals!
        Our mission is to provide a seamless and delightful experience for food enthusiasts
        to discover the best restaurants and savor their favorite cuisines.
      </p>
      <User />
    </div>
  );
}

export default About;
