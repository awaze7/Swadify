import { getUnitPrice } from "./priceUtils";

const DELIVERY_FEE_BASE = 40; // Base delivery fee
const PLATFORM_FEE_PERCENTAGE = 0.05; // 5% platform fee
const GST_PERCENTAGE = 0.05; // 5% GST on item subtotal

export const calculateOrderTotals = (items) => {
  if (!items || items.length === 0) {
    // An empty cart costs nothing. This branch used to return the full
    // DELIVERY_FEE_BASE and a total of ₹40, contradicting the non-empty branch
    // below (which correctly waives delivery when the subtotal is 0) and
    // rendering a "Total ₹40.00" summary for a cart with no items in it.
    return {
      totalItems: 0,
      itemSubtotal: 0,
      gst: 0,
      platformFee: 0,
      deliveryFee: 0,
      total: 0,
    };
  }

  const totalItems = items.reduce((sum, item) => {
    if (!item || !item.card || !item.card.info) return sum;
    return sum + (item.count || 0);
  }, 0);

  // Uses the shared resolver so an item priced only in its name (e.g.
  // "Paneer Roll - Rs 180") is billed instead of silently counted as ₹0.
  const itemSubtotal = items.reduce((sum, item) => {
    if (!item || !item.card || !item.card.info) return sum;
    return sum + getUnitPrice(item.card.info) * (item.count || 0);
  }, 0);

  // Calculate GST on item subtotal (typically 5%)
  const gst = parseFloat((itemSubtotal * GST_PERCENTAGE).toFixed(2));

  // Calculate platform fee on item subtotal (typically 5%)
  const platformFee = parseFloat((itemSubtotal * PLATFORM_FEE_PERCENTAGE).toFixed(2));

  // Delivery fee is fixed
  const deliveryFee = itemSubtotal > 0 ? DELIVERY_FEE_BASE : 0;

  // Total = items + GST + platform fee + delivery fee
  const total = parseFloat((itemSubtotal + gst + platformFee + deliveryFee).toFixed(2));

  return { totalItems, itemSubtotal, gst, platformFee, deliveryFee, total };
};

export const createOrder = (cartItems, user, deliveryAddress, specialInstructions, restaurantInfo, paymentMethod = 'cod') => {
  if (!cartItems || cartItems.length === 0 || !user) {
    throw new Error("Invalid order data: missing items or user");
  }

  const { itemSubtotal, gst, platformFee, deliveryFee, total } = calculateOrderTotals(cartItems);

  const items = cartItems.map((item) => {
    if (!item?.card?.info) {
      throw new Error("Invalid cart item structure");
    }
    return {
      itemId: item.card.info.id,
      name: item.card.info.name,
      // Persist the same resolved unit price the user was shown, so the stored
      // order reconciles with the total charged.
      price: getUnitPrice(item.card.info),
      quantity: item.count || 1,
      category: item.card.info.category || "General",
    };
  });

  // Timestamps are handled in Checkout.jsx to use serverTimestamp()
  return {
    userId: user.uid,
    restaurantId: restaurantInfo?.id || "",
    restaurantName: restaurantInfo?.name || "",
    items,
    itemSubtotal: parseFloat(itemSubtotal.toFixed(2)),
    gst: parseFloat(gst.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    deliveryFee: parseFloat(deliveryFee.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    status: "placed",
    deliveryAddress: deliveryAddress || "",
    phoneNumber: user.phoneNumber || "",
    specialInstructions: specialInstructions || "",
    paymentMethod: paymentMethod || 'cod',
  };
};

export const getStatusColor = (status) => {
  const statusColors = {
    placed: "bg-gray-100 text-gray-800 border-gray-300",
    confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    preparing: "bg-yellow-100 text-yellow-800 border-yellow-300",
    on_the_way: "bg-indigo-100 text-indigo-800 border-indigo-300",
    delivered: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  };
  return statusColors[status] || statusColors.placed;
};

export const getStatusLabel = (status) => {
  const labels = {
    placed: "Order Placed",
    confirmed: "Confirmed",
    preparing: "Preparing",
    on_the_way: "On the Way",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status] || "Unknown";
};
