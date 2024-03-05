import RestaurantCard, { withVegLabel } from "../components/RestaurantCard.js";
import { useState, useEffect } from "react";
import Shimmer from "../components/Shimmer.js";
import { Link } from "react-router-dom";
import useOnlineStatus from "../utils/useOnlineStatus.js";
import Offline from "./Offline.js";
import { SWIGGY_RESTAURANT_URL } from "../utils/constants.js";
// import { FaStar } from 'react-icons/fa';

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

      // console.log(resData);
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
    <div className="lg:mx-auto md:mx-16 sm:mx-10"> 
    {/* body mx-4 md:mx-1 lg:mx-20 xl:mx-26 mb-10 */}
      <div className="filter flex flex-col md:flex-row items-center md:ml-24 md:mr-20 lg:mx-28 sm:mx-4">
        <div className="mx-1 my-3 p-4">
          <input
            type="text"
            className="border border-solid text-base border-gray-400 rounded-lg py-0.5 px-3 outline-none"
            placeholder="Search for restaurants"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <button
            className="m-2 font-semibold text-base bg-blue-600 hover:bg-blue-700 px-3 py-1 text-white rounded-lg"
            onClick={() => {
              const filteredRestaurant = listOfRestaurants.filter(
                (res) => {
                  const nameMatch = res.info.name.toLowerCase().includes(searchText.toLowerCase())? true : false;
                  const cuisinesMatch = res.info.cuisines.some(cuisine =>
                    cuisine.toLowerCase().includes(searchText.toLowerCase())
                  )? true : false;
                  return nameMatch || cuisinesMatch;
                }
              );
              setFilteredRestaurants(filteredRestaurant);
            }}
          >
            Search
          </button>
        </div>
        <div className="my-1 flex items-center">
          <button
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 font-semibold text-white rounded-lg flex"
            onClick={() => {
              const filteredList = listOfRestaurants.filter(
                (res) => res.info.avgRating >= 4.5
              );
              setFilteredRestaurants(filteredList);
            }}
          >
            Top Rated Restaurants 
            {/* <FaStar className="mx-1 mt-1" /> */}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap md:ml-24 md:mr-24 lg:mx-28 sm:mx-4 mb-10">
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
