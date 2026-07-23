import { useState,useEffect } from "react";
import { MENU_URL } from "./constants";

// Add doc and getDoc to the Firebase Firestore imports here:
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const useRestaurantMenu = (resId) => {
    const [resInfo,setResInfo] = useState(null);

    //fetchdata
    useEffect(()=> {
        fetchdata();
    },[])

    const fetchdata = async () => {
        try {
            // Fetch the specific menu document from the 'menus' collection using resId
            const docRef = doc(db, "menus", String(resId));
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log("Menu fetched from Firestore:", docSnap.data());
                setResInfo(docSnap.data());
            } else {
                console.log("No such menu document found in Firestore!");
                setResInfo(null);
            }
        } catch (error) {
            console.error("Error fetching menu from Firestore:", error);
        }
    };
    return resInfo;
}

export default useRestaurantMenu;