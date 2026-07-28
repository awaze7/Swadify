import React from 'react';

// 1. Grid Card Skeleton - Wrapped in a white card box matching the real RestaurantCard structure
const ShimmerCard = () => {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm flex flex-col w-full">
      {/* Image Skeleton */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-200"></div>
      
      {/* Text Content Skeleton */}
      <div className="pt-3 flex flex-col gap-2">
        {/* Title */}
        <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
        {/* Meta Info (Rating & Time) */}
        <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
        {/* Cuisines */}
        <div className="h-3.5 bg-gray-200 rounded-md w-full"></div>
        {/* Cost */}
        <div className="h-3.5 bg-gray-200 rounded-md w-2/5"></div>
      </div>
    </div>
  );
};

// 2. Main Shimmer Layout
const Shimmer = () => {
  return (
    <div className="w-full min-h-screen bg-gray-50 pb-12 overflow-x-hidden animate-pulse"> 
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* --- CAROUSEL SKELETON --- */}
        <div className="mb-2">
          <div className="h-8 bg-gray-200 rounded-md w-64 md:w-80 mb-4"></div>
          
          <div className="flex gap-6 overflow-hidden pt-2 pb-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div 
                key={`carousel-shimmer-${n}`} 
                className="w-[200px] sm:w-[220px] md:w-[240px] h-[135px] sm:h-[150px] rounded-2xl bg-gray-200 shrink-0"
              ></div>
            ))}
          </div>
        </div>

        <hr className="border-gray-200 my-6 shadow-sm" />

        {/* --- MAIN RESTAURANT SECTION SKELETON --- */}
        {/* Added mb-8 to create the correct spacing between the search section and cards */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded-md w-72 md:w-96 mb-6"></div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="w-full md:w-[420px] h-[44px] bg-gray-200 rounded-full"></div>
            <div className="w-[110px] h-[44px] bg-gray-200 rounded-full hidden sm:block"></div>
            <div className="w-[138px] h-[44px] bg-gray-200 rounded-full hidden sm:block"></div>
          </div>
        </div>

        {/* --- RESTAURANT GRID SKELETON --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
          {[...Array(12)].map((_, index) => (
            <ShimmerCard key={`grid-shimmer-${index}`} />
          ))}
        </div>

      </div>
    </div>
  );
};

export default Shimmer;