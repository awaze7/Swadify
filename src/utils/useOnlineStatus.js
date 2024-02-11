import { useState, useEffect } from "react";

const useOnlineStatus = () => {
    //check if online
    const [onlineStatus,setOnlineStatus] = useState(true);

    useEffect(()=>{
        //adding eventlistener just once
        const handleOnline =() => setOnlineStatus(true);
        const handleOffline =() => setOnlineStatus(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
          };
    }, []);

    //return boolean value
    return onlineStatus;
}

export default useOnlineStatus;