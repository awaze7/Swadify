import RestaurantCard, { withVegLabel } from "./RestaurantCard";
import { useState,useEffect,useContext } from "react";
import Shimmer from "./Shimmer";
import { Link } from "react-router-dom";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline.js";
import { SWIGGY_RESTAURANT_URL } from "../utils/constants";


const Body = () => {

    const [listOfRestaurants, setListOfRestaurants] = useState([]);
    const [filteredRestaurant, setFilteredRestaurants] = useState([]);

    const [searchText, setSearchText] = useState("");

    const [loading, setLoading] = useState("true");

    const RestaurantCardWithVegLabel = withVegLabel(RestaurantCard);

    const onlineStatus = useOnlineStatus();



    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // handle the error using try-catch
        try {
            const response = await fetch(SWIGGY_RESTAURANT_URL); 
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

            // console.log(resData);

            setListOfRestaurants(resData);
            setFilteredRestaurants(resData);
            setLoading(false);
        } catch (error) {
            console.log(error);
        }
    }

    if (!onlineStatus) {
        return <Offline />;
    }

    return listOfRestaurants.length === 0 ? <Shimmer /> : (
        <div className="body mx-44 mb-10">
            <div className="filter flex">
                <div className="m-4 p-4">
                    <input 
                        type="text" 
                        className="border border-solid border-gray-400 rounded-lg py-1.5 px-4 outline-none" 
                        placeholder="Search for restaurants"
                        value={searchText}
                        onChange = {(e)=>{
                            setSearchText(e.target.value);
                        }} 
                    />
                    
                    <button  
                    className="px-3 py-2 m-2 font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    onClick={()=>{
                        //filter the restaurant-cards and update the UI
                        // console.log(searchText);
                        const filteredRestaurant = listOfRestaurants.filter(
                            (res)=> res.info.name.toLowerCase().includes(searchText.toLowerCase())
                        );
                        setFilteredRestaurants(filteredRestaurant);
                    }
                    }>
                    Search</button>                
                </div>
                <div className="m-1 flex items-center">
                    <button 
                        className="px-3 py-2 font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg" 
                        onClick={() => {
                            filteredList = listOfRestaurants.filter(
                                (res) => res.info.avgRating >= 4.5
                            );
                            setFilteredRestaurants(filteredList);
                        }}
                    >
                    Top Rated Restaurants
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap">
                {
                    filteredRestaurant.map(restaurant => 
                        <Link 
                            key={restaurant.info.id} 
                            to={"/restaurants/" + restaurant.info.id}
                        >
                            {/* If we want the restaurant is pure veg, add a veg label to it*/}
                            {
                                restaurant.info.veg ? (
                                    <RestaurantCardWithVegLabel resData={restaurant} />
                                )
                                : (
                                    <RestaurantCard resData={restaurant} />
                                )
                            }
                        </Link>
                    )
                }
            </div>
        </div>
    )
}

export default Body;
