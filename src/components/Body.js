import RestaurantCard from "./RestaurantCard";
import { useState } from "react";
import resList from "../utils/mockData";

const Body = () => {

    //state variable - Super powerful variable
    const [ListOfRestaurants, setListOfRestaurants] = useState(resList);

    return (
        <div className="body">
            <div className="filter">
                <button 
                className="filter-btn" 
                onClick={() => {
                    filteredList = ListOfRestaurants.filter(
                        (res) => res.data.avgRating > 4
                    );
                    setListOfRestaurants(filteredList);
                }}
            >
                Top Rated Restaurants
            </button>
            </div>
            <div className="res-container">
                {
                  ListOfRestaurants.map(restaurant => <RestaurantCard key={restaurant.data.id} resData={restaurant} /> )
                }
            </div>
        </div>
    )
}

export default Body;