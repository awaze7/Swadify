import { useState,useEffect } from 'react';

const User = () => {
    const [userInfo, setUserInfo] = useState({
        name: 'default name',
        location: 'default location',
    });

    useEffect(() => {
        const fetchData = async () => {
          try {
            const data = await fetch('https://api.github.com/users/awaze7');
            const json = await data.json();
    
            // console.log(json);
    
            setUserInfo(json);
          } catch (error) {
            console.log(error);
          }
        } 
        
        fetchData();

        // Cleanup function
        return () => {
          console.log('component will unmount');
        };
      }, []); 

    const { name, location, avatar_url } = userInfo;

    return (
        <div className="user-card">
            <img src={avatar_url} alt="avatar" />
            <h2>Name: {name}</h2>
            <h3>Location: {location}</h3>
            <h4>Contact: awazeshaikh7@gmail.com</h4>
        </div>
    )
}

export default User;