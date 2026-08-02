import { useState,useEffect } from "react";
import { MENU_URL } from "./constants";

// Add doc and getDoc to the Firebase Firestore imports here:
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const useRestaurantMenu = (resId) => {
    const [resInfo,setResInfo] = useState(null);

    // Refetch whenever resId changes. Previously this ran once on mount only ([] deps),
    // so navigating from one restaurant straight to another (same route, new :resId,
    // e.g. via the AI assistant's dish links) never reloaded — the old restaurant's
    // menu stayed on screen even though the URL updated.
    useEffect(()=> {
        let isCurrent = true; // guards against an older, slower request overwriting a newer one

        // Clear stale data immediately so we show the loading state instead of the
        // previous restaurant's menu while the new one is being fetched.
        setResInfo(null);

        const fetchdata = async () => {
            try {
                // Fetch the specific menu document from the 'menus' collection using resId
                const docRef = doc(db, "menus", String(resId));
                const docSnap = await getDoc(docRef);
                if (!isCurrent) return;

                if (docSnap.exists()) {
                    setResInfo(docSnap.data());
                } else {
                    console.log("No such menu document found in Firestore!");
                    setResInfo(null);
                }
            } catch (error) {
                if (isCurrent) console.error("Error fetching menu from Firestore:", error);
            }
        };

        fetchdata();

        return () => { isCurrent = false; };
    },[resId])

    return resInfo;
}

export default useRestaurantMenu;