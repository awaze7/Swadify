import { CDN_URL } from "../utils/constants";

const RestaurantCard = (props) => {
    const { resData } = props;

    const { 
      name,
      cloudinaryImageId, 
      cuisines, 
      avgRating, 
      costForTwo,
      sla,
      aggregatedDiscountInfoV3,
    } = resData?.info ?? {};
    
    return (
        <div className="m-6 w-[280px] rounded-lg bg-white hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-95">
            <div className="relative">
                {/* Render aggregated discount information if it's not null */}
                {aggregatedDiscountInfoV3 && (
                    <div className="absolute bottom-0 left-0 p-2 text-white text-2xl font-extrabold overflow-hidden whitespace-nowrap">
                        {aggregatedDiscountInfoV3.header} {aggregatedDiscountInfoV3.subHeader}
                    </div>
                )}
                <img 
                    className="w-full h-40 object-cover rounded-lg mb-0 shadow-inner" 
                    src={CDN_URL + cloudinaryImageId}
                    alt="rest-logo"
                />
            </div>
            <div className="p-2 mx-2">
                <h3 className="font-bold text-xl mb-1 line-clamp-1">{name}</h3>
                <div className="flex items-center mb-1 font-bold">
                    <span className="text-red-900 mr-1 text-2xl" role="img" aria-label="Rating">&#10026;</span>
                    <span className="text-lg">{avgRating}</span>
                    <p className="text-lg line-clamp-1">
                        ▪ {sla?.slaString}
                    </p>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                    {cuisines ? cuisines.join(", ") : ''}
                </p>
                <p className="text-sm font-bold mb-2">{costForTwo}</p>
            </div>
        </div>
    )
}

export const withVegLabel = (RestaurantCard) => {
    return (props) => {
        // {console.log("Veg")};
        return (
            <div className="relative">
                <label className="absolute z-10 bg-black text-white m-2 px-2 py-1 rounded-lg transform font-serif">Veg</label>
                <RestaurantCard {...props} />
            </div>
        )
    }
}

export default RestaurantCard;