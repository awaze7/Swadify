import React from 'react';
import User from './User';

const About = () => {
  return (
    <div className="about-container max-w-5xl mx-auto p-6 mt-20 rounded-lg shadow-lg bg-white">
      <h2 className="text-4xl font-bold mb-4 text-center">About Swadify</h2>
      <p className="text-gray-800 mb-6 text-center">
        Welcome to Swadify - your go-to platform for exploring and enjoying delicious meals!
        Our mission is to provide a seamless and delightful experience for food enthusiasts
        to discover the best restaurants and savor their favorite cuisines.
      </p>
      <User />
    </div>
  );
}

export default About;
