import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import useOnlineStatus from '../utils/useOnlineStatus';
import Offline from './Offline';
import ItemList from '../components/ItemList';
import { createOrder, calculateOrderTotals } from '../utils/orderUtils';
import { clearCart } from '../utils/Redux/cartSlice';
import { setCurrentOrder } from '../utils/Redux/orderSlice';
import { notify, updateNotification } from '../utils/notificationUtils';
import { useQueryClient } from '@tanstack/react-query';
import { orderHistoryKey } from '../utils/useOrderHistory';
import { describeFirestoreError } from '../utils/firestoreErrors';
import Button from '../components/Button';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((store) => store.user.user);
  const authLoading = useSelector((store) => store.user.isLoading);
  const cartItems = useSelector((store) => store.cart.items);
  const onlineStatus = useOnlineStatus();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    deliveryAddress: user?.address || '',
    phoneNumber: user?.phoneNumber || '',
    specialInstructions: '',
    paymentMethod: 'cod',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  /*
   * The Firebase session restores asynchronously, so `user` is null on the first
   * render of a hard-refreshed /checkout and only populates a moment later. The
   * form's initial state was captured from that null user and never re-synced,
   * leaving the saved address and phone blank for someone who has both on file.
   * Only overwrite fields the user hasn't typed into.
   */
  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      deliveryAddress: prev.deliveryAddress || user.address || '',
      phoneNumber: prev.phoneNumber || user.phoneNumber || '',
    }));
  }, [user]);

  if (!onlineStatus) {
    return <Offline />;
  }

  // Same gate as Profile: without it, an already-signed-in user refreshing this
  // page is told to log in before the auth listener has had a chance to resolve.
  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <span className="sr-only" role="status">
          Loading checkout
        </span>
        <div className="space-y-4" aria-hidden="true">
          <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">You're not signed in</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-gray-600">
            Log in to confirm your delivery address and place this order. Your cart is saved.
          </p>
          <Button
            size="lg"
            className="mt-7"
            // Carry the intent through so login returns them here rather than home.
            onClick={() => navigate('/login', { state: { from: '/checkout' } })}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-gray-600">
            Add a few dishes before checking out.
          </p>
          <Button size="lg" className="mt-7" onClick={() => navigate('/')}>
            Browse restaurants
          </Button>
        </div>
      </div>
    );
  }

  const { totalItems, itemSubtotal: subtotal, gst, platformFee, deliveryFee, total } = calculateOrderTotals(cartItems);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      notify.warning('Please fill all required fields correctly');
      return;
    }

    setSubmitting(true);
    const toastId = notify.loading('Processing your order...');

    try {
      // Create order object with user data merged
      const userData = {
        ...user,
        phoneNumber: formData.phoneNumber, // Use form value, not Redux state
      };

      const orderData = createOrder(cartItems, userData, formData.deliveryAddress, formData.specialInstructions, {
        id: cartItems[0]?.card?.restaurantId || '',
        name: cartItems[0]?.card?.restaurantName || 'Unknown Restaurant',
      });

      // Resolved once and reused: the confirmation screen has to render the same
      // value that was written, and serverTimestamp() is an unresolved sentinel
      // client-side, so `orderData.createdAt` cannot be read back from it.
      const estimatedDelivery = new Date(Date.now() + 35 * 60000);

      // Add to Firestore: orders/{userId}/orders/{orderId}
      const ordersRef = collection(db, 'orders', user.uid, 'orders');
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        createdAt: serverTimestamp(),
        estimatedDelivery,
      });

      if (!docRef?.id) {
        throw new Error("Failed to create order - no ID returned");
      }

      // `estimatedDelivery` and `createdAt` are included here because
      // OrderConfirmation renders straight from this Redux entry. Without them it
      // formatted `undefined` as a date and printed "Invalid Date".
      dispatch(
        setCurrentOrder({
          ...orderData,
          id: docRef.id,
          estimatedDelivery: estimatedDelivery.toISOString(),
          createdAt: new Date().toISOString(),
        })
      );
      dispatch(clearCart());

      // Order history is cached for 30s, so without this the order the user just
      // placed can be missing from Profile immediately after checkout.
      queryClient.invalidateQueries({ queryKey: orderHistoryKey(user.uid) });

      // Show success and navigate
      if (toastId) {
        updateNotification(toastId, {
          render: 'Order placed successfully!',
          type: 'success',
          isLoading: false,
          autoClose: 1500,
        });
      }

      // Navigate after Redux updates
      navigate(`/order-confirmation/${docRef.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      /*
       * Classified rather than a flat "Failed to place order". This write goes to
       * orders/{uid}/orders — the same subcollection the order-history read uses —
       * so if security rules don't cover it, this is the message that says so
       * ("Access denied") instead of hiding a permanent misconfiguration behind
       * an invitation to try again forever.
       */
      const { message } = describeFirestoreError(error, 'your order');
      if (toastId) {
        updateNotification(toastId, {
          render: message,
          type: 'error',
          isLoading: false,
          autoClose: 6000,
        });
      } else {
        notify.error(message);
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto my-8 w-full max-w-5xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900 sm:text-3xl">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Form Section */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Summary */}
            <section className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <ItemList items={cartItems} inCart={true} readOnly={true} />
              </div>
            </section>

            {/* Delivery Address */}
            <section>
              <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
              <div>
                <label htmlFor="delivery-address" className="block text-sm font-semibold text-gray-700 mb-2">
                  Address <span className="text-red-500" aria-label="required">*</span>
                </label>
                <textarea
                  id="delivery-address"
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleInputChange}
                  rows="3"
                  maxLength="500"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.deliveryAddress}
                  aria-describedby={errors.deliveryAddress ? "address-error" : undefined}
                  className={`w-full rounded-lg border px-3 py-2.5 transition-colors focus:border-transparent focus:ring-2 focus:ring-gray-900 ${
                    errors.deliveryAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full delivery address"
                />
                {errors.deliveryAddress && (
                  <p id="address-error" className="text-red-500 text-sm mt-1" role="alert">
                    {errors.deliveryAddress}
                  </p>
                )}
              </div>
            </section>

            {/* Phone Number */}
            <section>
              <h2 className="text-xl font-bold mb-4">Contact Information</h2>
              <div>
                <label htmlFor="phone-number" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="phone-number"
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  aria-required="true"
                  aria-invalid={!!errors.phoneNumber}
                  aria-describedby={errors.phoneNumber ? "phone-error" : undefined}
                  className={`w-full rounded-lg border px-3 py-2.5 transition-colors focus:border-transparent focus:ring-2 focus:ring-gray-900 ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+91 XXXXXXXXXX"
                />
                {errors.phoneNumber && (
                  <p id="phone-error" className="text-red-500 text-sm mt-1" role="alert">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>
            </section>

            {/* Special Instructions */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-gray-900">Special Instructions</h2>
              <label htmlFor="special-instructions" className="mb-2 block text-sm font-semibold text-gray-700">
                Anything the restaurant should know? (Optional)
              </label>
              <textarea
                id="special-instructions"
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleInputChange}
                rows="2"
                maxLength="300"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 transition-colors focus:border-transparent focus:ring-2 focus:ring-gray-900"
                placeholder="e.g., No onions, extra spicy"
              />
            </section>

            {/* Payment Method */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-gray-900">Payment Method</h2>
              <label className="flex cursor-pointer items-center rounded-lg border border-gray-300 px-4 py-3 transition-colors hover:bg-gray-50 focus-within:ring-2 focus-within:ring-gray-900">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={handleInputChange}
                  className="mr-3 h-4 w-4 accent-gray-900"
                />
                <span className="font-medium text-gray-900">Cash on Delivery (COD)</span>
              </label>
            </section>

            {/* Submit Button */}
            <Button
              type="submit"
              size="xl"
              fullWidth
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? 'Placing your order…' : `Place Order · ₹${total.toFixed(2)}`}
            </Button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="md:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm sm:p-6 md:top-20">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Order Total</h2>

            <dl className="mb-4 space-y-2.5">
              <div className="flex justify-between text-sm text-gray-700">
                <dt>Item total ({totalItems} {totalItems === 1 ? 'item' : 'items'})</dt>
                <dd className="tabular-nums">₹{subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <dt>GST (5%)</dt>
                <dd className="tabular-nums">₹{gst.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <dt>Platform fee (5%)</dt>
                <dd className="tabular-nums">₹{platformFee.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2.5 text-sm text-gray-700">
                <dt>Delivery fee</dt>
                <dd className="tabular-nums">₹{deliveryFee.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between rounded-lg bg-white px-3 py-2.5 text-base font-bold text-gray-900 ring-1 ring-gray-200">
                <dt>Grand total</dt>
                <dd className="tabular-nums">₹{total.toFixed(2)}</dd>
              </div>
            </dl>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <p className="mb-1 font-semibold">Estimated delivery time</p>
              <p>30–45 minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
