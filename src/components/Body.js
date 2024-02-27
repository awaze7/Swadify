import RestaurantCard, { withVegLabel } from "./RestaurantCard";
import { useState, useEffect } from "react";
import Shimmer from "./Shimmer";
import { Link } from "react-router-dom";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline.js";
import { SWIGGY_RESTAURANT_URL } from "../utils/constants";

const Body = () => {
  const [listOfRestaurants, setListOfRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const RestaurantCardWithVegLabel = withVegLabel(RestaurantCard);
  const onlineStatus = useOnlineStatus();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(SWIGGY_RESTAURANT_URL);
      const json = await response.json();

      async function checkJsonData(jsonData) {
        for (let i = 0; i < jsonData?.data?.cards.length; i++) {
          let checkData = json?.data?.cards[i]?.card?.card?.gridElements
            ?.infoWithStyle?.restaurants;

          if (checkData !== undefined) {
            return checkData;
          }
        }
      }

      const resData = await checkJsonData(json);
      setListOfRestaurants(resData);
      setFilteredRestaurants(resData);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  if (!onlineStatus) {
    return <Offline />;
  }

  return loading ? (
    <Shimmer />
  ) : (
    <div className="body mx-4 md:mx-10 lg:mx-20 xl:mx-44 mb-10">
      <div className="filter flex flex-col md:flex-row items-center">
        <div className="m-4 p-4">
          <input
            type="text"
            className="border border-solid text-base border-gray-400 rounded-lg py-1 px-3 outline-none"
            placeholder="Search for restaurants"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <button
            className="m-2 font-semibold text-base bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-white rounded-lg"
            onClick={() => {
              const filteredRestaurant = listOfRestaurants.filter(
                (res) =>
                  res.info.name.toLowerCase().includes(searchText.toLowerCase())
              );
              setFilteredRestaurants(filteredRestaurant);
            }}
          >
            SEARCH
          </button>
        </div>
        <div className="m-1 flex items-center">
          <button
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 font-semibold text-white rounded-lg"
            onClick={() => {
              const filteredList = listOfRestaurants.filter(
                (res) => res.info.avgRating >= 4.5
              );
              setFilteredRestaurants(filteredList);
            }}
          >
            TOP RATED RESTAURANTS
          </button>
        </div>
      </div>
      <div className="flex flex-wrap">
        {filteredRestaurants.map((restaurant) => (
          <Link
            key={restaurant.info.id}
            to={"/restaurants/" + restaurant.info.id}
          >
            {restaurant.info.veg ? (
              <RestaurantCardWithVegLabel resData={restaurant} />
            ) : (
              <RestaurantCard resData={restaurant} />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Body;
