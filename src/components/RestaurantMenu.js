import { useEffect, useState } from "react";
import Shimmer from "./Shimmer";
import { useParams } from "react-router-dom";
import useRestaurantMenu from "../utils/useRestaurantMenu";
import RestaurantCategory from "./RestaurantCategory";


const RestaurantMenu = () => {
    const { resId } = useParams();

    const resInfo = useRestaurantMenu(resId);

    const [showIndex, setShowIndex] = useState(null);

    if(resInfo === null) return <Shimmer /> ; //create one for menu later-------------------

    const {name, cuisines, costForTwoMessage} =  
        resInfo?.data?.cards[0]?.card?.card?.info;

    const { itemCards } = resInfo?.data?.cards[2]?.groupedCard?.cardGroupMap?.REGULAR?.cards[2]?.card?.card;

    const categories = resInfo?.data?.cards[2]?.groupedCard?.cardGroupMap?.REGULAR?.cards.filter(
        (c) => 
            c?.card?.card?.["@type"]==="type.googleapis.com/swiggy.presentation.food.v2.ItemCategory"
    );

    // console.log("Menu ", categories);
    
    return (
        <div className="text-center">
            <h1 className="font-bold my-6 text-2xl">{name}</h1>
            <p className="font-bold text-lg">
                {cuisines.join(", ")} - {costForTwoMessage} 
            </p>
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