import { CDN_URL } from "../utils/constants";

const RestaurantCard = (props) => {
    const { resData } = props;

    const { 
      name,
      cloudinaryImageId, 
      cuisines, 
      avgRating, 
      costForTwo,
      sla
    } = resData?.info ?? {};
    
    return (
        <div className="res-card">
            <img 
            className="res-logo"
            src= {CDN_URL + cloudinaryImageId}
            alt="rest-logo"
            />
            <h3>{name}</h3>
            <h4>{cuisines ? cuisines.join(", ") : ''}</h4>
            <h4>{avgRating} stars</h4>
            <h4>{costForTwo}</h4>
            <h4>{sla?.slaString}</h4>
        </div>
    )
}

export default RestaurantCard;