import { useDispatch } from "react-redux";
import { addItem, incrementItem, decrementItem, removeItem, clearCart,updateTotal } from "../utils/Redux/cartSlice";
import { CDN_URL } from "../utils/constants";
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

  const onDecrement = async (itemId) => {
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
        marginTop: hasActiveNotification ? '0' : '110px',
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
      const price = isNaN(item.card.info.price) ? 
                    extractPriceFromName(item.card.info.name) : 
                    item.card.info.price / 100;
      return total + (item.count * price);
    }, 0);
    dispatch(updateTotal(totalAmount.toFixed(2)));
  }

  const handlePlaceOrder = () => {
    // console.log(totalAmount.toFixed(2));
    // console.log(totalItems);

    // Check if the user is logged in
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(user);
        // User is logged in, proceed with placing the order
        toast.success('Order placed successfully, you will receive it shortly!',{
          style: {
            backgroundColor: "green",
            color: "white",
            marginTop: hasActiveNotification ? '0' : '110px',
          },
          onClose: () => setHasActiveNotification(false),
        });
        setTimeout(()=>{
          dispatch(clearCart());
        },1200);

        
      } else {
        // User is not logged in, show alert and navigate to login page
        alert("Please log in before placing an order.");
        navigate("/login");
      }
    });
  };

  return (
    <div>
           {items.map(item => (
                <div key={item.card.info.id} className="py-2 my-3 pb-3 border-gray-200 border-b-2 text-left flex items-center justify-between">
                <div className="w-9/12">
                    <div className="py-2 text-lg font-medium">
                        <span>{item.card.info.name}</span>
                        {/* <span> - ₹ {item.card.info.price/100}</span> */}
                        {isNaN(item.card.info.price) || extractPriceFromName(item.card.info.name)!="" ? null : (
                            <span> - ₹ {item.card.info.price/100}</span>
                        )}
                    </div>
                    {inCart ?
                        <span className="font-bold text-xl font-mono mr-2">{item.count}x</span> : 
                        <p className="text-sm text">
                            {item.card.info.description}
                        </p>
                    }
                </div>
                <div className="flex-shrink-0 w-40 p-4">
                    <div className="absolute">
                        {inCart ? 
                            <div className="py-1 px-4 mx-3 mt-14 text-xl flex items-center bg-black rounded-lg text-white">
                                <button className="pr-1 rounded-l" onClick={() => onIncrement(item.card.info.id)}>
                                +
                                </button>
                                <span className="px-4">{item.count}</span>
                                <button className="pl-1 rounded-r" onClick={() => onDecrement(item.card.info.id)}>
                                -
                                </button>
                            </div>
                            :
                            <button 
                            className = "py-2 px-8 mx-4 mt-14 bg-black text-white rounded-lg shadow-black shadow-md"
                            onClick = {() => {addItemFunc(item)}}
                            >ADD</button>
                        }
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
                    <div className="flex justify-end mt-4">
                         <button 
                            className="bg-red-500 text-white px-4 py-2 rounded-full mx-2" 
                            onClick={handlePlaceOrder}
                        >Place Order</button>
                        <button 
                            className="bg-red-500 text-white px-4 py-2 rounded-full"
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