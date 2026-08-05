import { useEffect, useState, useMemo } from "react";
import { MenuShimmer } from "../components/Shimmer";
import { useParams, useLocation } from "react-router-dom"; // Added useLocation
import useRestaurantMenu from "../utils/useRestaurantMenu";
import RestaurantCategory from "../components/RestaurantCategory";
import { BIKE_ICON } from "../utils/constants";
import useOnlineStatus from "../utils/useOnlineStatus";
import useReducedMotion from "../utils/useReducedMotion";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Offline from "./Offline";


const RestaurantMenu = () => {
    const { resId } = useParams();
    // Keying on resId forces React to fully unmount and remount RestaurantMenuView
    // whenever the restaurant changes, instead of reusing the same instance with
    // updated props. /restaurants/:resId is a single route, so React Router does
    // NOT remount this component on its own when only the param changes — clicking
    // from one restaurant straight to another (e.g. via the AI assistant's dish
    // links) previously left every bit of local state (menu data, expanded
    // category, scroll target) pointed at the old restaurant. This key guarantees
    // a clean slate every time, independent of any effect's dependency array.
    return <RestaurantMenuView key={resId} resId={resId} />;
};

const RestaurantMenuView = ({ resId }) => {
    const location = useLocation(); // Added location hook

    const resInfo = useRestaurantMenu(resId);
    const { isLoading, errorInfo, notFound, refetch, isRefreshing } = resInfo;
    const menu = resInfo.resInfo;

    const [showIndex, setShowIndex] = useState(null);
    const [highlightedDishId, setHighlightedDishId] = useState(null);

    const onlineStatus = useOnlineStatus();
    const reducedMotion = useReducedMotion();

    const resCard = menu?.data?.cards?.find(
        card =>
            card.card &&
            card.card.card &&
            card.card.card["@type"] === "type.googleapis.com/swiggy.presentation.food.v2.Restaurant"
    );

    const resDetails = resCard?.card?.card?.info || menu?.restaurantInfo;

    const groupedCard = menu?.data?.cards?.find(
        card => card.groupedCard
    )?.groupedCard;

    const categories = useMemo(() => {
        const regularCategories = groupedCard?.cardGroupMap?.REGULAR?.cards.filter(
            (c) =>
                c?.card?.card?.["@type"]==="type.googleapis.com/swiggy.presentation.food.v2.ItemCategory"
        ) || [];

        if (regularCategories.length > 0) return regularCategories;

        if (menu?.categories) {
            return menu.categories.map(cat => ({
                card: {
                    card: {
                        title: cat.title,
                        itemCards: (cat.items || []).map(item => ({
                            card: {
                                info: item
                            }
                        }))
                    }
                }
            }));
        }

        return [];
    }, [groupedCard, menu?.categories]);

    /**
     * Deep link from the AI assistant: open the dish's category, scroll it into
     * view and highlight it briefly.
     *
     * The highlight used to be applied by mutating `element.classList` from a
     * 500ms `setTimeout` — a guess at when React would have painted the newly
     * expanded category. If the render was slower the element didn't exist yet
     * and nothing happened at all; and because React never knew about those
     * classes, any later re-render silently wiped them mid-animation. Driving it
     * from state means the highlight is part of the render output and cannot
     * desynchronise. The scroll still needs one frame to wait for the expanded
     * category to lay out, but it no longer owns the highlight.
     */
    useEffect(() => {
        const targetDishId = new URLSearchParams(location.search).get("dishId");
        if (!targetDishId || categories.length === 0) return;

        const categoryIndex = categories.findIndex((cat) =>
            cat?.card?.card?.itemCards?.some(
                (item) => String(item?.card?.info?.id) === String(targetDishId)
            )
        );
        if (categoryIndex === -1) return;

        setShowIndex(categoryIndex);
        setHighlightedDishId(String(targetDishId));

        const frame = requestAnimationFrame(() => {
            document.getElementById(`dish-${targetDishId}`)?.scrollIntoView({
                behavior: reducedMotion ? "auto" : "smooth",
                block: "center",
            });
        });

        // Long enough to find the dish after the scroll settles, short enough
        // that it doesn't linger as permanent-looking decoration.
        const clearHighlight = setTimeout(() => setHighlightedDishId(null), 3000);

        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(clearHighlight);
        };
    }, [categories, location.search, reducedMotion]);

    // Offline is checked before anything else: it explains the failure better than
    // a generic error panel would.
    if (!onlineStatus) {
        return <Offline />;
    }

    if (isLoading) return <MenuShimmer />;

    /*
     * Previously there was only a `resInfo === null` check rendering <Shimmer />.
     * Because the old hook set null both while loading AND on failure, a menu that
     * failed to load span its skeleton forever — no message, no retry.
     */
    if (errorInfo) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
                <ErrorState errorInfo={errorInfo} onRetry={refetch} isRetrying={isRefreshing} />
            </div>
        );
    }

    /*
     * Two distinct causes, deliberately not merged: `notFound` means there is no
     * menu document for this restaurant, which is the restaurant's own state and
     * a legitimate empty. An empty `categories` off a document that DOES exist
     * means the payload didn't match the shape we parse at `categories` above —
     * that's our problem, not the restaurant's, so it gets an error with a retry
     * rather than a message implying the restaurant chose not to publish.
     */
    if (notFound) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
                <EmptyState
                    title="Menu not available"
                    description="This restaurant hasn't published its menu yet. Try another restaurant in the meantime."
                    actionLabel="Browse restaurants"
                    actionTo="/"
                />
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
                <ErrorState
                    errorInfo={{
                        kind: "unknown",
                        title: "We couldn't read this menu",
                        message:
                            "The menu loaded but we couldn't make sense of it. Retrying often clears this up.",
                        retryable: true,
                    }}
                    onRetry={refetch}
                    isRetrying={isRefreshing}
                />
            </div>
        );
    }

    const {name, cuisines, locality, totalRatingsString, avgRating, feeDetails} =
        resDetails || {
            name: "",
            cuisines: [],
            locality: "",
            totalRatingsString: "",
            avgRating: 0,
            feeDetails: { message: "" },
        };

    const cuisinesList = Array.isArray(cuisines) ? cuisines.join(", ") : "";

    // Identity stamped onto every cart entry added from this menu, so the order
    // written at checkout knows which restaurant it belongs to.
    const restaurant = { id: String(resId), name };

    return (
        // Was `w-7/12` at every breakpoint — 58% of a 375px phone left a ~218px
        // column, so item rows, prices and the ADD control were crushed together
        // on mobile. Now full-width with padding on small screens, constrained
        // only once there is room for it.
        //
        // `pb-28` reserves a gutter the floating CraveAI launcher can sit in.
        // The launcher is fixed bottom-right and the ADD controls occupy the
        // menu's right-hand column, so on narrow screens — where the menu spans
        // the full width — the bubble sat directly on top of the last item's ADD
        // button with no way to scroll it clear.
        <div className="mx-auto mb-8 mt-3 w-full max-w-3xl px-4 pb-28 sm:px-6 lg:px-0">
            <div className="my-4">
                <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="mt-6 text-xl font-bold text-gray-900 sm:text-2xl">{name}</h1>
                        <p className="flex flex-col text-sm text-gray-500 sm:text-base">
                            <span>{cuisinesList}</span>
                            <span>{locality}</span>
                        </p>
                    </div>
                    <div className="mb-4 mt-6 flex flex-shrink-0 flex-col items-center rounded-lg border border-solid px-2">
                        <div className="text-red-900">
                            <span className="pt-1 text-xl font-semibold">&#9733;</span>
                            <span className="pt-1 text-lg font-semibold"> {avgRating}</span>
                        </div>
                        <div className="my-1.5 w-full border-b"></div>
                        <span className="whitespace-nowrap pb-2 text-sm font-medium text-red-900">
                            {totalRatingsString}
                        </span>
                    </div>
                </div>
                <div className="flex">
                    <img className="mr-1 mt-1 h-4 w-auto object-cover"
                        alt=""
                        src= {BIKE_ICON}
                    />
                    <span className="text-sm text-gray-500 sm:text-base" dangerouslySetInnerHTML={{ __html: feeDetails?.message || "" }} />
                </div>
            </div>

            {categories
                .filter((category) => (category?.card?.card?.itemCards?.length || 0) > 0)
                .map(
                    (category, index) => (
                        <RestaurantCategory
                            data={category?.card?.card}
                            key={category?.card?.card?.title}
                            restaurant={restaurant}
                            highlightedDishId={highlightedDishId}
                            showItems={index === showIndex ? true : false}
                            setShowIndex ={()=> setShowIndex(index)}
                            unsetShowIndex ={()=> setShowIndex(null)}
                        />
                    )
                )}

        </div>
    )
}

export default RestaurantMenu;