import React, { useState, useEffect } from 'react';
import { GITHUB_URL } from '../utils/constants';

const User = () => {
  const [userInfo, setUserInfo] = useState({
    name: 'Swadify Developer',
    location: 'Food Paradise',
    avatar_url: '', 
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetch(GITHUB_URL);   
        const json = await data.json();
        console.log(json);
        setUserInfo(json);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();

    return () => {
      console.log('component will unmount');
    };
  }, []);

  const { name, location, avatar_url } = userInfo;

  return (
    <div className="user-card bg-gray-800 text-white p-4 rounded-lg shadow-md flex-column items-center justify-between">
      <div className="flex items-center mb-4">
        <img className="w-24 h-24 rounded-full border-2 border-gray-700 mr-4" src={avatar_url} alt="avatar" />
        <div className="text-lg mb-2">
          <h2 className="mb-1">I am <span className='font-medium'>{name}</span>, a BE student from Sinhgad College of Engineering, {location}.</h2>
          <p className="mb-1">You can reach me at <span className='font-medium'>awazeshaikh7@gmail.com</span>.</p>
        </div>
      </div>

      <div className="text-lg">
        <p>
            I'm the developer behind Swadify, your ultimate food exploration platform.
        </p>
        <p className="mb-4">
          I'm a passionate computer engineer dedicated to creating delightful experiences for food enthusiasts.
          Feel free to reach out and share your thoughts!
        </p>
      </div>
    </div>

  );
};

export default User;
