import { CDN_URL } from "../utils/constants";


const ItemList = ({items}) => {
    
    // console.log("Items ", items);
    
    return (
        <div>
           {items.map(item => (
                <div key={item.card.info.id} className="py-2 my-2 pb-3 border-gray-200 border-b-2 text-left flex items-center justify-between">
                <div className="w-9/12">
                    <div className="py-2 text-lg font-medium">
                        <span>{item.card.info.name}</span>
                        <span> - ₹ {item.card.info.price/100}</span>
                    </div>
                    <p className="text-sm text">
                        {item.card.info.description}
                    </p>
                </div>
                <div className="flex-shrink-0 w-40 p-4">
                    <div className="absolute">
                        <button className="py-2 px-8 mx-4 mt-14 bg-black text-white rounded-lg shadow-black shadow-md">ADD</button>
                    </div>
                    <img 
                        src={CDN_URL + item.card.info.imageId} 
                        alt={item.card.info.name}
                        className="w-full h-full object-cover rounded"
                    />
                </div>
            </div>
            
            ))
            }
        </div>
    )
}

export default ItemList;