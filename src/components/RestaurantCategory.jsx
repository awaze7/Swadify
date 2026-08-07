import ItemList from "./ItemList";

const RestaurantCategory = ({data, showItems, setShowIndex, unsetShowIndex, restaurant, highlightedDishId}) => {
    const handleClick = () => {
        showItems ? unsetShowIndex() : setShowIndex();
    }

    return (
        <div className="mx-3 my-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 shadow-sm">
            {/*
              A real <button> rather than a div with onClick: the accordion was
              previously unreachable by keyboard, so no keyboard or screen-reader
              user could open a menu category — i.e. could not order at all.
            */}
            <button
                type="button"
                onClick={handleClick}
                aria-expanded={showItems}
                className="flex w-full items-center justify-between gap-4 rounded-lg py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
            >
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {data.title} ({data.itemCards.length})
                </span>
                <span
                    aria-hidden="true"
                    className={`inline-block flex-shrink-0 text-2xl leading-none text-gray-700 dark:text-gray-400 transition-transform duration-200 ${showItems ? 'rotate-180' : ''}`}
                >
                    &#9662;
                </span>
            </button>

            {showItems && (
                <ItemList
                    items={data.itemCards}
                    restaurant={restaurant}
                    highlightedDishId={highlightedDishId}
                />
            )}
        </div>
    );
}

export default RestaurantCategory;