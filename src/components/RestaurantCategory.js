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
            <div className="w-7/12 mx-auto my-4 bg-gray-50 shadow-lg p-4">
                <div 
                    className="flex justify-between cursor-pointer" 
                    onClick={handleClick}
                >
                    <span className="font-bold text-lg">
                        {data.title} ({data.itemCards.length})
                    </span>
                    <span className="text-4xl">🢓</span>
                </div>

                { showItems && <ItemList items={data.itemCards} /> }
            </div>
            {/* body */}
            
        </div>
    );
}

export default RestaurantCategory;