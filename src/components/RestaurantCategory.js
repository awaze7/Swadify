import ItemList from "./ItemList";

const RestaurantCategory = ({data, showItems, setShowIndex, unsetShowIndex}) => {
    // console.log(data);
    
    const handleClick = () => {
        // console.log(data.title, showItems)
        showItems ? unsetShowIndex() : setShowIndex();
    }

    return (
        <div> {/* returns the accordion item*/}
            <div className="mx-3 my-3 shadow-md px-4 py-2">
                <div 
                    className="flex justify-between cursor-pointer" 
                    onClick={handleClick}
                >
                    <span className="font-bold text-base">
                        {data.title} ({data.itemCards.length})
                    </span>
                    <div>
                        <span className={`text-2xl inline-block ${showItems ? 'transform rotate-180' : ''}`}>&#9662;</span>

                    </div>
                </div>

                { showItems && <ItemList items={data.itemCards} /> }
            </div>
            
        </div>
    );
}

export default RestaurantCategory;