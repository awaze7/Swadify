import { useEffect, useState } from "react";
import Shimmer from "./Shimmer";
import { useParams } from "react-router-dom";
import useRestaurantMenu from "../utils/useRestaurantMenu";
import RestaurantCategory from "./RestaurantCategory";
import { BIKE_ICON } from "../utils/constants";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline.js";


const RestaurantMenu = () => {
    const { resId } = useParams();

    const resInfo = useRestaurantMenu(resId);

    const [showIndex, setShowIndex] = useState(null);

    const onlineStatus = useOnlineStatus();

    if(resInfo === null) return <Shimmer /> ; //create one for menu later-------------------

    // console.log(resInfo);

    const {name, cuisines,locality, costForTwoMessage, totalRatingsString, avgRating, feeDetails} =  
        resInfo?.data?.cards[2]?.card?.card?.info || {};

    const categories = resInfo?.data?.cards[4]?.groupedCard?.cardGroupMap?.REGULAR?.cards.filter(
        (c) => 
            c?.card?.card?.["@type"]==="type.googleapis.com/swiggy.presentation.food.v2.ItemCategory"
    );

    // console.log("Menu ", categories);
    if (!onlineStatus) {
        return <Offline />;
    }
    
    return (
        <div className="w-7/12 mx-auto my-4 bg-white">{/*text-center"> */}
            <div className="mx-3 my-4">
                <div className="flex">
                    <div className="w-10/12">
                        <h1 className="font-bold mt-6 text-2xl">{name}</h1>
                        <p className="text-gray-500 text-base flex flex-col">
                            <span>{cuisines.join(", ")}</span>
                            <span>{locality}</span>
                        </p>
                        <p></p>
                    </div>
                    <div className="rounded-lg border border-solid flex flex-col items-center mt-4 px-2 ml-auto cursor-pointer">
                        <div className="text-red-900">
                            <span className="text-2xl font-semibold pt-1">&#9733;</span>
                            <span className="text-lg font-semibold pt-1"> {avgRating}</span>
                        </div>
                    
                        <div className="border-b w-full my-2"></div>
                        <span className="text-red-900 text-sm font-medium">{totalRatingsString}</span>
                    </div>
                </div>
                <div className="flex mt-4">
                    <img className="w-auto h-5 object-cover mt-1 mr-1"
                        alt="bike-icon"
                        src= {BIKE_ICON}
                    />
                    <span className="text-gray-500 text-xl">{feeDetails.message}</span>
                </div>
            </div>

            {/* categories- accordians */}
            {categories.map(
                (category,index) => (
                    //RestaurantCategory is a controlled component now
                    <RestaurantCategory 
                        data={category?.card?.card} 
                        key={category?.card?.card?.title}
                        showItems={index === showIndex ? true : false}
                        setShowIndex ={()=> setShowIndex(index)}
                        unsetShowIndex ={()=> setShowIndex(null)}
                    />
                )   
            )}

        </div>
    )
}

export default RestaurantMenu;