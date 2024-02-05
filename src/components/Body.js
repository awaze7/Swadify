import RestaurantCard from "./RestaurantCard";
import { useState,useEffect } from "react";

const Body = () => {

    //state variable - Super powerful variable
    const [ListOfRestaurants, setListOfRestaurants] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const data = await fetch("https://www.swiggy.com/dapi/restaurants/list/v5?lat=18.5204303&lng=73.8567437&page_type=DESKTOP_WEB_LISTING");
        
        const json = await data.json();

        // console.log(json); //json.data.cards[4].data.data.cards

        console.log(json.data.cards[4].card.card.gridElements.infoWithStyle.restaurants);
        console.log(json.data.cards[4].card.card.gridElements.infoWithStyle.restaurants[0]);
        setListOfRestaurants(json.data.cards[4].card.card.gridElements.infoWithStyle.restaurants);
    }

    return (
        <div className="body">
            <div className="filter">
                <button 
                className="filter-btn" 
                onClick={() => {
                    filteredList = ListOfRestaurants.filter(
                        (res) => res.info.avgRating > 4.2
                    );
                    setListOfRestaurants(filteredList);
                }}
            >
                Top Rated Restaurants
            </button>
            </div>
            <div className="res-container">
                {
                  ListOfRestaurants.map(restaurant => <RestaurantCard key={restaurant.info.id} resData={restaurant} /> )
                }
            </div>
        </div>
    )
}

export default Body;
