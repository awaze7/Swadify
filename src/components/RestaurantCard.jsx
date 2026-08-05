import { CDN_URL } from "../utils/constants";

const RestaurantCard = ({ resData }) => {
  const {
    name,
    cloudinaryImageId,
    cuisines,
    avgRating,
    costForTwo,
    sla,
    aggregatedDiscountInfoV3,
    veg,
  } = resData?.info ?? {};

  const discount = aggregatedDiscountInfoV3
    ? [aggregatedDiscountInfoV3.header, aggregatedDiscountInfoV3.subHeader]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    // Fluid width: this card sits in Body's responsive grid, so a hard
    // `w-[236px]` left it unable to fill its column at md/lg and nearly
    // overflowing at 320px. The hover scale lives on the parent <Link>, not
    // here — having it on both nested elements compounded the transform.
    <div className="h-full overflow-hidden rounded-xl bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative">
        {veg && (
          <div className="absolute right-2 top-2 z-10 flex items-center justify-center rounded-md border border-white/15 bg-black/40 p-1 shadow-sm backdrop-blur-md">
            <div
              className="flex h-4 w-4 items-center justify-center border-[1.5px] border-green-500"
              role="img"
              aria-label="Pure vegetarian"
            >
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
          </div>
        )}

        <img
          className="h-40 w-full rounded-xl object-cover"
          src={CDN_URL + cloudinaryImageId}
          // Named rather than "rest-logo": every card previously announced the
          // same meaningless alt text, so a screen reader heard "rest-logo"
          // forty times with no way to tell the restaurants apart.
          alt={name ? `${name} storefront` : ""}
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 rounded-b-xl bg-gradient-to-t from-black to-transparent" />
        {discount && (
          // Constrained and clamped: as an unbounded `whitespace-nowrap`
          // absolute element, a long offer header ran straight out past the
          // card's rounded edge and over the neighbouring card.
          <p className="absolute bottom-1 left-2 right-2 line-clamp-1 text-lg font-extrabold text-white">
            {discount}
          </p>
        )}
      </div>

      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 text-lg font-bold text-gray-900">{name}</h3>

        <div className="mb-1 flex items-center justify-between gap-2 font-bold">
          <span className="flex items-center gap-1">
            <span className="text-xl text-red-900" aria-hidden="true">
              &#10026;
            </span>
            <span className="text-base">
              <span className="sr-only">Rated </span>
              {avgRating}
            </span>
          </span>

          <p className="whitespace-nowrap text-base text-gray-800">{sla?.slaString}</p>
        </div>

        <p className="mb-2 line-clamp-1 text-xs text-gray-600">
          {cuisines?.length ? cuisines.join(", ") : ""}
        </p>
        <p className="text-sm font-bold text-gray-900">{costForTwo}</p>
      </div>
    </div>
  );
};

export default RestaurantCard;
