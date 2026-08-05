import { FaStar } from 'react-icons/fa';
import { CDN_URL } from '../utils/constants';

const CarouselRestaurantCard = ({ resData }) => {
  const {
    name,
    cloudinaryImageId,
    avgRating,
    sla,
    cuisines,
    aggregatedDiscountInfoV3
  } = resData?.info || {};

  const imageUrl = cloudinaryImageId ? CDN_URL + cloudinaryImageId : "";

  const timeString = sla?.slaString || "30-35 mins";
  const mainCuisine = cuisines && cuisines.length > 0 ? cuisines[0] : "Delicious Food";
  
  // Extracting discount info for a cleaner tag
  const discountHeader = aggregatedDiscountInfoV3?.header;
  const discountSub = aggregatedDiscountInfoV3?.subHeader;

  return (
    // Responsive sizing: scales from 240px to 280px based on screen size
    <div className="w-[200px] sm:w-[220px] md:w-[240px] h-[135px] sm:h-[150px] rounded-2xl overflow-hidden relative shadow-sm hover:shadow-xl transition-shadow duration-300 group border border-gray-100">
      
      {/* Background Image with slower, smoother zoom */}
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      
      {/* Professional Gradient Overlay: darker at bottom, fading smoothly */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Clean Discount Tag (Top Left) instead of the ribbon */}
      {discountHeader && (
         <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-tight z-10">
            {discountHeader} {discountSub}
         </div>
      )}

      {/* Bottom Content Wrapper */}
      <div className="absolute bottom-0 w-full p-3 sm:p-4 flex flex-col justify-end z-10">
        
        {/* Subtle Cuisine Subtitle */}
        <span className="text-gray-300 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase mb-1 opacity-80">
          {mainCuisine}
        </span>
        
        {/* Restaurant Name */}
        <h3 className="text-white font-bold text-base sm:text-lg truncate w-full mb-1.5 drop-shadow-md">
          {name}
        </h3>
        
        {/* Meta Data & Action Button Row */}
        <div className="flex items-center justify-between w-full">
            
            <div className="flex items-center text-[10px] sm:text-[11px] text-gray-200 font-medium">
              {/* Standardized Rating Badge */}
              <span className="flex items-center bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] mr-2 font-bold shadow-sm">
                <FaStar className="mr-0.5 text-[8px]" /> {avgRating}
              </span>
              <span className="mr-1.5">{timeString}</span>
              {/* <span className="mr-1.5 opacity-50">•</span> */}
              {/* <span className="truncate">{costForTwo}</span> */}
            </div>

            {/* A <span>, not a <button>: this card is always rendered inside a
                <Link>, and a button nested in an anchor is invalid HTML that
                screen readers report inconsistently. It was decorative anyway —
                it had no onClick, so the surrounding link did all the work. */}
            <span className="hidden rounded-lg border border-white/20 bg-white/20 px-3 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-md transition-all duration-300 group-hover:bg-white/30 sm:block">
              Explore
            </span>
        </div>
      </div>
    </div>
  );
};

// Moved Veg label to top-right to balance the new discount tag on the top-left
export const withCarouselVegLabel = (WrappedComponent) => {
  return (props) => {
    return (
      <div className="relative">
        <div className="absolute top-3 right-3 z-20 bg-green-700/90 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 border border-green-500/30">
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-300 rounded-full inline-block"></span>
          VEG
        </div>
        <WrappedComponent {...props} />
      </div>
    );
  };
};

export default CarouselRestaurantCard;