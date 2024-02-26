import { useState } from "react";
import ItemList from "./ItemList";

const RestaurantCategory = ({data, showItems, setShowIndex, unsetShowIndex}) => {
    // console.log(data);
    
    handleClick = () => {
        // console.log(data.title, showItems)
        showItems ? unsetShowIndex() : setShowIndex();
    }

    return (
        <div> {/* returns the accordian item*/}
            {/* header */}
            <div className="mx-3 my-4 shadow-md p-4">
                <div 
                    className="flex justify-between cursor-pointer" 
                    onClick={handleClick}
                >
                    <span className="font-bold text-lg">
                        {data.title} ({data.itemCards.length})
                    </span>
                    <div>
                        <span className={`text-4xl inline-block ${showItems ? 'transform rotate-180' : ''}`}>&#9662;</span>

                    </div>
                </div>

                { showItems && <ItemList items={data.itemCards} /> }
            </div>
            {/* body */}
            
        </div>
    );
}

export default RestaurantCategory;