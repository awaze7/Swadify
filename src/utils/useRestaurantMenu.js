import { useState,useEffect } from "react";
import { MENU_URL } from "../utils/constants";

const useRestaurantMenu = (resId) => {
    const [resInfo,setResInfo] = useState(null);

    //fetchdata
    useEffect(()=> {
        fetchdata();
    },[])

    const fetchdata = async () => {
        const data = await fetch(MENU_URL + resId);
        const json = await data.json();

        console.log(json);
        setResInfo(json);
    }
    return resInfo;
}

export default useRestaurantMenu;