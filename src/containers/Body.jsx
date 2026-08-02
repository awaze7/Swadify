import RestaurantCard from "../components/RestaurantCard";
import { useState, useMemo } from "react";
import Shimmer from "../components/Shimmer";
import { Link } from "react-router-dom";
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";
import { FaStar, FaTimes } from 'react-icons/fa';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useQuery } from '@tanstack/react-query';
import RestaurantCarousel from "../components/RestaurantCarousel";
import SortDropdown from "../components/SortDropdown";
import { sortRestaurants } from "../utils/sortUtils";


const fetchRestaurants = async () => {
  const querySnapshot = await getDocs(collection(db, "restaurants_data"));
  let rawList = [];

  querySnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data?.data?.cards) {
      data.data.cards.forEach((cardObj) => {
        const restaurants = cardObj?.card?.card?.gridElements?.infoWithStyle?.restaurants;
        if (Array.isArray(restaurants)) rawList.push(...restaurants);
      });
    } else if (Array.isArray(data.restaurants)) {
      rawList.push(...data.restaurants);
    } else if (Array.isArray(data.cards)) {
      rawList.push(...data.cards);
    } else {
      rawList.push({ ...data, _docId: doc.id });
    }
  });

  return rawList
    .map((item) => {
      const infoObj = item?.info || item?.card?.card?.info || item?.restaurantInfo || item;
      return {
        info: {
          id: infoObj?.id || item?._docId || String(Math.random()),
          name: infoObj?.name || "Unnamed Restaurant",
          cloudinaryImageId: infoObj?.cloudinaryImageId || "",
          cuisines: Array.isArray(infoObj?.cuisines) ? infoObj.cuisines : [],
          avgRating: infoObj?.avgRating || infoObj?.rating || "N/A",
          costForTwo: infoObj?.costForTwo || infoObj?.costForTwoMessage || "N/A",
          veg: infoObj?.veg ?? infoObj?.isVeg ?? false,
          sla: infoObj?.sla || { slaString: infoObj?.slaString || (infoObj?.deliveryTime ? `${infoObj.deliveryTime} mins` : "30-35 mins") },
          aggregatedDiscountInfoV3: infoObj?.aggregatedDiscountInfoV3 || null,
        },
      };
    })
    .filter((res) => res.info.name !== "Unnamed Restaurant" || res.info.cloudinaryImageId !== "");
};

const Body = () => {
  const [searchText, setSearchText] = useState("");
  const [activeSearch, setActiveSearch] = useState(""); 
  const [isTopRated, setIsTopRated] = useState(false);
  const [selectedSort, setSelectedSort] = useState("relevance");
  const onlineStatus = useOnlineStatus();
  

  const { data: listOfRestaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: fetchRestaurants,
    staleTime: 1000 * 60 * 10, 
  });

  const filteredRestaurants = useMemo(() => {
    let filtered = listOfRestaurants;
    
    if (activeSearch) {
      filtered = filtered.filter((res) => {
        const nameMatch = res.info.name.toLowerCase().includes(activeSearch.toLowerCase());
        const cuisinesMatch = res.info.cuisines.some(cuisine =>
          cuisine.toLowerCase().includes(activeSearch.toLowerCase())
        );
        return nameMatch || cuisinesMatch;
      });
    }
    
    if (isTopRated) {
      filtered = filtered.filter((res) => parseFloat(res.info.avgRating) >= 4.5);
    }
    
    return sortRestaurants(filtered, selectedSort);
  }, [listOfRestaurants, activeSearch, isTopRated, selectedSort]);

  if (!onlineStatus) return <Offline />;
  if (isLoading) return <Shimmer />;

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-12 overflow-x-hidden"> 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        <div className="mb-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Handpicked For Your Cravings
          </h2>
          <RestaurantCarousel restaurants={listOfRestaurants} />
        </div>

        <hr className="border-gray-200 my-6 shadow-sm" />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Restaurants with online food delivery
          </h1>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-200 overflow-hidden w-full md:w-[420px] transition-all focus-within:shadow-md focus-within:border-gray-300">
              <input
                type="text"
                className="px-5 py-2.5 w-full outline-none text-gray-700 bg-transparent text-sm font-medium placeholder:text-gray-400"
                placeholder="Search for restaurants, cuisines..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button 
                className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 text-sm font-bold transition-colors shrink-0"
                onClick={() => setActiveSearch(searchText)}
              >
                Search
              </button>
            </div>

            <SortDropdown 
              selectedSort={selectedSort} 
              onSortChange={setSelectedSort} 
            />

            {/* Crave AI now has a persistent launcher rendered globally by
                CraveAIAssistant.jsx (visible on every page, not just here) */}

            <button 
              onClick={() => setIsTopRated(!isTopRated)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-200 border shadow-sm shrink-0 min-w-[138px] ${
                isTopRated 
                  ? 'bg-gray-900 text-yellow-400 border-gray-900 ring-2 ring-yellow-400/20' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <span>Top Rated</span>
              <FaStar className={isTopRated ? "text-yellow-400 text-xs shrink-0" : "text-amber-500 text-xs shrink-0"} />
              {isTopRated && (
                <span className="bg-gray-800 text-gray-300 rounded-full p-1 hover:text-white hover:bg-gray-700 transition-colors shrink-0">
                  <FaTimes className="text-[10px]" />
                </span>
              )}
            </button>
          </div>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-12 mb-20">
            <p className="text-gray-500 font-semibold text-lg">No restaurants found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredRestaurants.map((restaurant) => (
              <Link
                key={`grid-${restaurant.info.id}`}
                to={"/restaurants/" + restaurant.info.id}
                className="hover:scale-[0.98] transition-transform duration-200"
              >
                <RestaurantCard resData={restaurant} />
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Body;