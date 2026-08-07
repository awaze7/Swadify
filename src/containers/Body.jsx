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
    <div className="w-full min-h-screen bg-amber-50 dark:bg-gray-950 pb-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        <div className="mb-2">
          <h1 className="sr-only">Order food online</h1>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Handpicked For Your Cravings
          </h2>
          <RestaurantCarousel restaurants={listOfRestaurants} />
        </div>

        <hr className="border-gray-200 dark:border-gray-700 my-6 shadow-sm" />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Restaurants with online food delivery
          </h2>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                setActiveSearch(searchText.trim());
              }}
              className="flex w-full items-center overflow-hidden rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all focus-within:border-gray-300 dark:focus-within:border-gray-500 focus-within:shadow-md md:w-[420px]"
            >
              <label htmlFor="restaurant-search" className="sr-only">
                Search for restaurants or cuisines
              </label>
              <input
                id="restaurant-search"
                type="search"
                className="w-full bg-transparent px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Search for restaurants, cuisines..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button
                type="submit"
                className="shrink-0 bg-gray-900 dark:bg-yellow-500 dark:text-gray-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black dark:hover:bg-yellow-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-500"
              >
                Search
              </button>
            </form>

            <SortDropdown
              selectedSort={selectedSort}
              onSortChange={setSelectedSort}
            />

            <button
              onClick={() => setIsTopRated(!isTopRated)}
              aria-pressed={isTopRated}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-200 border shadow-sm shrink-0 min-w-[138px] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-yellow-400 focus-visible:ring-offset-2 ${
                isTopRated
                  ? 'bg-gray-900 dark:bg-yellow-500 text-yellow-400 dark:text-gray-900 border-gray-900 dark:border-yellow-500 ring-2 ring-yellow-400/20'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300'
              }`}
            >
              <span>Top Rated</span>
              <FaStar className={isTopRated ? "text-yellow-400 dark:text-gray-900 text-xs shrink-0" : "text-amber-500 text-xs shrink-0"} />
              {isTopRated && (
                <span className="bg-gray-800 dark:bg-gray-900 text-gray-300 rounded-full p-1 hover:text-white hover:bg-gray-700 transition-colors shrink-0">
                  <FaTimes className="text-[10px]" />
                </span>
              )}
            </button>
          </div>
        </div>

        <p role="status" aria-live="polite" className="sr-only">
          {isError
            ? ''
            : `${filteredRestaurants.length} ${
                filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'
              } found`}
        </p>

        {isError ? (
          <ErrorState
            errorInfo={describeFirestoreError(error, "restaurants")}
            onRetry={refetch}
            isRetrying={isFetching}
            className="mt-12 mb-20"
          />
        ) : filteredRestaurants.length === 0 ? (
          <div className="mb-20 mt-12 flex flex-col items-center justify-center">
            <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
              No restaurants found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredRestaurants.map((restaurant) => (
              <Link
                key={`grid-${restaurant.info.id}`}
                to={"/restaurants/" + restaurant.info.id}
                className="rounded-xl transition-transform duration-200 hover:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-yellow-400 focus-visible:ring-offset-2"
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