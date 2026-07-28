import React from 'react';
import { Link } from "react-router-dom";
// 1. Import the new specific Carousel Card and its Veg Label HOC
import CarouselRestaurantCard, { withCarouselVegLabel } from "./CarouselRestaurantCard";

const CarouselCardWithVegLabel = withCarouselVegLabel(CarouselRestaurantCard);

const RestaurantCarousel = ({ restaurants }) => {
  if (!restaurants || restaurants.length === 0) return null;
  const carouselRestaurants = restaurants.slice(0, 20);

  return (
    <div className="mt-3 mb-2 w-full max-w-full overflow-hidden block">
      <style>
        {`
          @keyframes infinite-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-infinite-scroll {
            display: flex;
            width: max-content;
            animation: infinite-scroll 90s linear infinite;
          }
          .animate-infinite-scroll:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      <h2 className="text-2xl font-bold mb-4 md:ml-24 lg:mx-28 sm:mx-4 text-gray-800">
        Handpicked For Your Cravings
      </h2>
      
      <div className="w-full overflow-hidden relative">
        <div className="animate-infinite-scroll gap-6 px-4">
          
          {/* First Set */}
          {carouselRestaurants.map((restaurant) => (
            <Link
              key={`carousel-1-${restaurant.info.id}`}
              to={"/restaurants/" + restaurant.info.id}
              className="shrink-0 transition-transform duration-300 hover:scale-[0.98] block"
            >
              {restaurant.info.veg ? (
                <CarouselCardWithVegLabel resData={restaurant} />
              ) : (
                <CarouselRestaurantCard resData={restaurant} />
              )}
            </Link>
          ))}

          {/* Duplicated Set for Loop */}
          {carouselRestaurants.map((restaurant) => (
            <Link
              key={`carousel-2-${restaurant.info.id}`}
              to={"/restaurants/" + restaurant.info.id}
              className="shrink-0 transition-transform duration-300 hover:scale-[0.98] block"
            >
              {restaurant.info.veg ? (
                <CarouselCardWithVegLabel resData={restaurant} />
              ) : (
                <CarouselRestaurantCard resData={restaurant} />
              )}
            </Link>
          ))}
          
        </div>
      </div>
    </div>
  );
};

export default RestaurantCarousel;