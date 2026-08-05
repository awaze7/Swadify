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
import ErrorState from "../components/ErrorState";
import { describeFirestoreError } from "../utils/firestoreErrors";
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
    .map((item, index) => {
      const infoObj = item?.info || item?.card?.card?.info || item?.restaurantInfo || item;
      return {
        info: {
          // Falls back to a stable positional key, never `Math.random()`. A
          // random id changed on every refetch (breaking React's reconciliation)
          // and was also used as the `/restaurants/:resId` route param, so those
          // cards linked to a menu that could never resolve.
          id: infoObj?.id || item?._docId || `unlisted-${index}`,
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
  

  const { data: listOfRestaurants = [], isLoading, isError, error, refetch, isFetching } = useQuery({
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
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                setActiveSearch(searchText.trim());
              }}
              className="flex w-full items-center overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm transition-all focus-within:border-gray-300 focus-within:shadow-md md:w-[420px]"
            >
              {/* Wrapping in a <form> is what makes Enter submit. Previously the
                  input was bare, so pressing Enter did nothing at all and the
                  search was mouse-only. */}
              <label htmlFor="restaurant-search" className="sr-only">
                Search for restaurants or cuisines
              </label>
              <input
                id="restaurant-search"
                type="search"
                className="w-full bg-transparent px-5 py-2.5 text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400"
                placeholder="Search for restaurants, cuisines..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button
                type="submit"
                className="shrink-0 bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-500"
              >
                Search
              </button>
            </form>

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

        {isError ? (
          /* A failed fetch used to fall through to the empty branch and read
             "No restaurants found matching your criteria." — telling the user
             their search was too narrow when in fact the request had failed and
             offering no way to retry. */
          <ErrorState
            errorInfo={describeFirestoreError(error, "restaurants")}
            onRetry={refetch}
            isRetrying={isFetching}
            className="mt-12 mb-20"
          />
        ) : filteredRestaurants.length === 0 ? (
          <div className="mb-20 mt-12 flex flex-col items-center justify-center">
            <p className="text-lg font-semibold text-gray-500">
              No restaurants found matching your criteria.
            </p>
          </div>
        ) : (
          // Gaps match Shimmer's grid exactly, so the skeleton and the real
          // cards occupy the same geometry and the page doesn't jump when data
          // lands. (The spacing used to come from an `m-5` on the card itself,
          // which was removed when the card was made fluid.)
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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