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
    
    // const imageSrc = cloudinaryImageId ? `${CDN_URL}${cloudinaryImageId}` : null;
    // const placeholderImage = "https://media-assets.swiggy.com/swiggy/image/upload/dls-web/assets/images/placeholder-light.png";

    return (
        <div className="m-5 w-[236px] rounded-xl bg-white hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-95">
            <div className="relative">
                <img 
                    className="w-full h-40 object-cover rounded-xl mb-0" 
                    src={CDN_URL + cloudinaryImageId}
                    // src={imageSrc || placeholderImage}
                    alt="rest-logo"
                />
                <div className="absolute bottom-0 left-0 right-0 top-auto bg-gradient-to-t from-black to-transparent h-16"></div>
                {aggregatedDiscountInfoV3 && (
                    <div className="absolute bottom-0 left-2 p-1 text-white text-xl font-extrabold overflow-hidden whitespace-nowrap">
                        {aggregatedDiscountInfoV3.header} {aggregatedDiscountInfoV3.subHeader}
                    </div>
                )}
            </div>
            <div className="p-2 mx-2">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{name}</h3>
                <div className="flex items-center mb-1 font-bold">
                    <span className="text-red-900 mr-1 text-xl" role="img" aria-label="Rating">&#10026;</span>
                    <span className="text-base">{avgRating}</span>
                    <p className="text-base line-clamp-1">
                        ▪ {sla?.slaString}
                    </p>
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-1">
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
                <label className="absolute z-10 bg-black text-white m-2 px-2 py-1 rounded-lg text-sm transform font-serif">Veg</label>
                <RestaurantCard {...props} />
            </div>
        )
    }
}

export default RestaurantCard;