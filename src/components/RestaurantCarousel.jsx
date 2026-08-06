import { useState } from "react";
import { Link } from "react-router-dom";
import { FiPause, FiPlay } from "react-icons/fi";
import CarouselRestaurantCard, { withCarouselVegLabel } from "./CarouselRestaurantCard";
import useReducedMotion from "../utils/useReducedMotion";

const CarouselCardWithVegLabel = withCarouselVegLabel(CarouselRestaurantCard);

const CarouselItem = ({ restaurant, duplicate }) => (
  <Link
    to={"/restaurants/" + restaurant.info.id}
    // The duplicated set exists purely so the CSS translate can loop
    // seamlessly. It is hidden from assistive tech and removed from the tab
    // order — otherwise every restaurant was announced and tabbed through
    // twice.
    aria-hidden={duplicate || undefined}
    tabIndex={duplicate ? -1 : undefined}
    className="block shrink-0 rounded-xl transition-transform duration-300 hover:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
  >
    {restaurant.info.veg ? (
      <CarouselCardWithVegLabel resData={restaurant} />
    ) : (
      <CarouselRestaurantCard resData={restaurant} />
    )}
  </Link>
);

const RestaurantCarousel = ({ restaurants }) => {
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);

  if (!restaurants || restaurants.length === 0) return null;
  const carouselRestaurants = restaurants.slice(0, 20);

  // Motion is off entirely when the OS asks for reduced motion; the strip then
  // becomes a normal horizontally scrollable row rather than a moving one.
  const animated = !reducedMotion;
  const isRunning = animated && !paused;

  return (
    <div className="block w-full max-w-full overflow-hidden">
      <div className="relative w-full overflow-hidden">
        <div
          className={
            animated
              ? // w-max lets the track be as wide as both copies of the list so
                // the translate has somewhere to travel. Hover and focus-within
                // pause it too, so tabbing into a card stops the strip sliding
                // out from under the focus ring.
                "flex w-max animate-infinite-scroll gap-6 pb-4 pt-2 " +
                "hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] " +
                (paused ? "[animation-play-state:paused]" : "")
              : "flex gap-6 overflow-x-auto pb-4 pt-2"
          }
        >
          {carouselRestaurants.map((restaurant) => (
            <CarouselItem key={`carousel-1-${restaurant.info.id}`} restaurant={restaurant} />
          ))}

          {animated &&
            carouselRestaurants.map((restaurant) => (
              <CarouselItem
                key={`carousel-2-${restaurant.info.id}`}
                restaurant={restaurant}
                duplicate
              />
            ))}
        </div>
      </div>

      {/* WCAG 2.2.2: motion that starts automatically and runs for more than
          five seconds needs a mechanism to pause it. Hovering paused it, but
          that is unavailable to keyboard and touch users. */}
      {animated && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
        >
          {isRunning ? (
            <FiPause size={13} aria-hidden="true" />
          ) : (
            <FiPlay size={13} aria-hidden="true" />
          )}
          {isRunning ? "Pause" : "Play"}
          <span className="sr-only"> restaurant carousel</span>
        </button>
      )}
    </div>
  );
};

export default RestaurantCarousel;
