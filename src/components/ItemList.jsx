import { useDispatch } from "react-redux";
import { addItem, incrementItem, decrementItem, removeItem, clearCart,updateTotal } from "../utils/Redux/cartSlice";
import { ITEM_IMG_CDN_URL } from "../utils/constants";
import { useState } from "react";
import { toast } from 'react-toastify';
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

const ItemList = ({ items, inCart }) => {
  const dispatch = useDispatch();
  const [updatingCart, setUpdatingCart] = useState(false);
  const [hasActiveNotification, setHasActiveNotification] = useState(false);
  const navigate = useNavigate();

  const handleAddItem = (item) => {
    dispatch(addItem(item));
  };

  const onIncrement = (item) => {
    dispatch(incrementItem(item));
  };

  const handleDecrementItem = (item) => {
    dispatch(decrementItem(item));
  };

  const onDecrement = (itemId) => {
    if (items.find((item) => item.card.info.id === itemId).count > 1) {
      handleDecrementItem(itemId);
    } else {
      setUpdatingCart(true);
      dispatch(removeItem(itemId));
      setTimeout(() => setUpdatingCart(false), 1000);
    }
  };

  const addItemFunc = (item) => {
    let t = `${item.card.info.name} is added in the cart`;
    // console.log(t);
    toast.info(t, {
      style: {
        backgroundColor: "black",
        color: "white",
        marginTop: hasActiveNotification ? '0' : '80px',
      },
      onClose: () => setHasActiveNotification(false),
    });
    setHasActiveNotification(true);
    handleAddItem(item);
  };

  const handleClearCart = () => {
      dispatch(clearCart());
  }

  const extractPriceFromName = (name) => {
    const regex = /(?:Rs|₹)\s*(\d+(?:\.\d+)?)/;
    const match = name.match(regex);
    return match ? parseFloat(match[1]) : 0;
  };

  let totalItems = 0;
  let totalAmount = 0;

  if (inCart) {
    totalItems = items.reduce((total, item) => total + item.count, 0);
    totalAmount = items.reduce((total, item) => {
      let price=0;
      if (isNaN(item.card.info.price)) {
        if(isNaN(item.card.info.defaultPrice)) {
          price = extractPriceFromName(item.card.info.name);
        } else {
          price = item.card.info.defaultPrice / 100;
        }
      } else {
        price = item.card.info.price / 100;
      }
      
      return total + (item.count * price);
    }, 0);

    dispatch(updateTotal(totalAmount.toFixed(2)));
  }

  const handlePlaceOrder = () => {
    // Check if the user is logged in
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // console.log(user);
        toast.success('Order placed successfully, you will receive it shortly!',{
          style: {
            backgroundColor: "green",
            color: "white",
            marginTop: hasActiveNotification ? '0' : '80px',
          },
          onClose: () => setHasActiveNotification(false),
        });
        setTimeout(()=>{
          dispatch(clearCart());
        },1200);

        
      } else {
        // User is not logged in, show alert and navigate to login page
        toast.warning('Please log in before placing an order.',{
          position: "top-center",
          style: {
            marginTop: hasActiveNotification ? '0' : '80px',
          },
          onClose: () => setHasActiveNotification(false),
        });
        navigate("/login");
      }
    });
  };

  return (
    <div>
           {items.map(item => (
                <div key={item.card.info.id} className="my-2 pb-3 border-gray-200 border-b-2 text-left flex items-center justify-between">
                <div className="w-9/12">
                    <div className="py-2 text-base font-medium">
                        <span>{item.card.info.name}</span>
                        {(isNaN(item.card.info.price) && isNaN(item.card.info.defaultPrice)) || 
                          extractPriceFromName(item.card.info.name)!="" ? null : 
                          (
                            <span> - ₹ {item.card.info.price ? item.card.info.price/100 : item.card.info.defaultPrice/100}</span>
                          )
                        }
                    </div>
                    <p className="text-sm font-normal">
                            {item.card.info.description}
                    </p>
                    {inCart ?
                        <div className="mt-3">
                          <span className="font-bold text-xl font-mono mr-2">{item.count}<span className="text-sm">x</span></span> 
                        </div>
                        
                        : null }

                </div>
                <div className="flex-shrink-0 w-40 py-3 px-4">
                    <div className="absolute">
                        {inCart ? 
                            <div className="py-1 mx-5 mt-14 text-xl flex items-center bg-gray-900 hover:bg-black rounded-lg text-white">
                                <button className="pr-2 pl-3 rounded-l" onClick={() => onDecrement(item.card.info.id)}>
                                -
                                </button>
                                <span className="px-2">{item.count}</span>
                                <button className="pl-2 pr-3 rounded-r" onClick={() => onIncrement(item.card.info.id)}>
                                +
                                </button>
                            </div>
                            :
                            <button 
                            className = "py-1 px-7 mx-5 mt-14 bg-gray-900 hover:bg-black text-white rounded-lg shadow-black shadow-sm"
                            onClick = {() => {addItemFunc(item)}}
                            >ADD</button>
                        }
                    </div>
                    <img 
                        src={ITEM_IMG_CDN_URL + item.card.info.imageId} 
                        alt={item.card.info.name}
                        className="w-full h-full object-cover rounded"
                    />
                </div>
            </div>
            
            ))
            }
            {updatingCart && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-opacity-75 bg-gray-500 text-white">
                Updating Cart...
                </div>
            )}

            {inCart && items.length > 0 && (
              <div>
                    <div className="text-center mt-4">
                    <p>Total Items: {totalItems}</p>
                    <p>Total Amount: ₹{totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-end mt-2">
                         <button 
                            className="m-2 font-semibold text-base bg-blue-600 hover:bg-blue-700 px-3 py-1 text-white rounded-xl"
                            onClick={handlePlaceOrder}
                        >Place Order</button>
                        <button 
                            className="m-2 font-semibold text-base bg-blue-600 hover:bg-blue-700 px-3 py-1 text-white rounded-xl"
                            onClick={handleClearCart}
                        >
                            Clear Cart
                        </button>
                    </div>
              </div>
          )}
        </div>
    )
}

export default ItemList;