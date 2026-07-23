import RestaurantCard, { withVegLabel } from "../components/RestaurantCard";
import { useState, useEffect } from "react";
import Shimmer from "../components/Shimmer";
import { Link } from "react-router-dom";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";
import { SWIGGY_RESTAURANT_URL } from "../utils/constants";
import { FaStar } from 'react-icons/fa';

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

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
      const querySnapshot = await getDocs(collection(db, "restaurants_data"));
      let rawList = [];

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();

        // 1. If Firestore document contains the raw Swiggy initialState.json structure
        if (data?.data?.cards) {
          data.data.cards.forEach((cardObj) => {
            const restaurants = cardObj?.card?.card?.gridElements?.infoWithStyle?.restaurants;
            if (Array.isArray(restaurants)) {
              rawList.push(...restaurants);
            }
          });
        } 
        // 2. If document contains a top-level array of restaurants
        else if (Array.isArray(data.restaurants)) {
          rawList.push(...data.restaurants);
        } 
        else if (Array.isArray(data.cards)) {
          rawList.push(...data.cards);
        } 
        // 3. Individual restaurant document
        else {
          rawList.push({ ...data, _docId: doc.id });
        }
      });

      console.log("Raw Extracted Documents from Firestore:", rawList);

      // Normalize each item to ensure 'info' exists with valid properties
      const normalizedData = rawList
        .map((item) => {
          // Find the info object regardless of nesting
          const infoObj = 
            item?.info || 
            item?.card?.card?.info || 
            item?.restaurantInfo || 
            item;

          return {
            info: {
              id: infoObj?.id || item?._docId || String(Math.random()),
              name: infoObj?.name || "Unnamed Restaurant",
              cloudinaryImageId: infoObj?.cloudinaryImageId || "",
              cuisines: Array.isArray(infoObj?.cuisines) ? infoObj.cuisines : [],
              avgRating: infoObj?.avgRating || infoObj?.rating || "N/A",
              costForTwo: infoObj?.costForTwo || infoObj?.costForTwoMessage || "N/A",
              veg: infoObj?.veg ?? infoObj?.isVeg ?? false,
              sla: infoObj?.sla || { 
                slaString: infoObj?.slaString || (infoObj?.deliveryTime ? `${infoObj.deliveryTime} mins` : "30-35 mins") 
              },
              aggregatedDiscountInfoV3: infoObj?.aggregatedDiscountInfoV3 || null,
            },
          };
        })
        // Filter out empty placeholder cards if any document was invalid
        .filter((res) => res.info.name !== "Unnamed Restaurant" || res.info.cloudinaryImageId !== "");

      console.log("Normalized Restaurant Data:", normalizedData);
      setListOfRestaurants(normalizedData);
      setFilteredRestaurants(normalizedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching restaurants from Firestore:", error);
      setLoading(false);
    }
  };

  if (!onlineStatus) {
    return <Offline />;
  }

  return loading ? (
    <Shimmer />
  ) : (
    <div className="lg:mx-auto md:mx-16 sm:mx-10"> 
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
            <FaStar className="ml-2 mt-1" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap lg:mx-28 mb-10 sm:mx-4">
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
