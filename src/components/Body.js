import RestaurantCard from "./RestaurantCard";
import { useState,useEffect } from "react";
import Shimmer from "./Shimmer";

const Body = () => {
    const [listOfRestaurants, setListOfRestaurants] = useState([]);
    const [filteredRestaurant, setFilteredRestaurants] = useState([]);

    const [searchText, setSearchText] = useState("");

    // console.log("body render");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // handle the error using try-catch
        try {
            const response = await fetch("https://www.swiggy.com/dapi/restaurants/list/v5?lat=18.5204303&lng=73.8567437&page_type=DESKTOP_WEB_LISTING");
            const json = await response.json();
    
            // initialize checkJsonData() function to check Swiggy Restaurant data
            async function checkJsonData(jsonData) {
                for (let i = 0; i < jsonData?.data?.cards.length; i++) {
                    let checkData = json?.data?.cards[i]?.card?.card?.gridElements?.infoWithStyle?.restaurants;
                    
                    if (checkData !== undefined) {
                        return checkData;
                    }
                }
            }
    
            const resData = await checkJsonData(json);
    
            setListOfRestaurants(resData);
            setFilteredRestaurants(resData);
        } catch (error) {
            console.log(error);
        }
    }

    return listOfRestaurants.length === 0 ? <Shimmer /> : (
        <div className="body">
            <div className="filter">
                <div className="search">
                    <input 
                        type="text" 
                        className="search-box" 
                        value={searchText}
                        onChange = {(e)=>{
                            setSearchText(e.target.value);
                        }} 
                    />
                    <button onClick={()=>{
                        //filter the restaurant-cards and update the UI
                        //Search-text
                        console.log(searchText);
                        const filteredRestaurant = listOfRestaurants.filter(
                            (res)=> res.info.name.toLowerCase().includes(searchText.toLowerCase())
                        );
                        setFilteredRestaurants(filteredRestaurant);
                    }
                    }>
                    Search</button>                
                </div>
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
                  filteredRestaurant.map(restaurant => <RestaurantCard key={restaurant.info.id} resData={restaurant} /> )
                }
            </div>
        </div>
    )
}

export default Body;
