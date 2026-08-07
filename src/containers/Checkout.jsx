import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import useOnlineStatus from '../utils/useOnlineStatus';
import Offline from './Offline';
import ItemList from '../components/ItemList';
import { createOrder, calculateOrderTotals } from '../utils/orderUtils';
import { openRazorpayCheckout } from '../utils/razorpayService';
import { clearCart } from '../utils/Redux/cartSlice';
import { setCurrentOrder } from '../utils/Redux/orderSlice';
import { notify, updateNotification } from '../utils/notificationUtils';
import { useQueryClient } from '@tanstack/react-query';
import { orderHistoryKey } from '../utils/useOrderHistory';
import { describeFirestoreError } from '../utils/firestoreErrors';
import Button from '../components/Button';
import {
  SiPhonepe, SiGooglepay, SiPaytm,
} from 'react-icons/si';
import {
  FiCreditCard, FiDollarSign, FiShield, FiChevronRight,
  FiCheck, FiLock,
} from 'react-icons/fi';
import { BsBank2 } from 'react-icons/bs';

// ---------------------------------------------------------------------------
// Payment method definitions
// ---------------------------------------------------------------------------
const PAYMENT_METHODS = [
  {
    id: 'upi',
    label: 'UPI',
    subtitle: 'PhonePe · GPay · Paytm & more',
    icons: [SiPhonepe, SiGooglepay, SiPaytm],
    razorpayMethod: 'upi',
    badge: 'Instant',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    subtitle: 'Visa · Mastercard · RuPay',
    icons: [FiCreditCard],
    razorpayMethod: 'card',
    badge: null,
    badgeColor: '',
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    subtitle: 'All major Indian banks',
    icons: [BsBank2],
    razorpayMethod: 'netbanking',
    badge: null,
    badgeColor: '',
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    subtitle: 'Pay when your order arrives',
    icons: [FiDollarSign],
    razorpayMethod: null,
    badge: null,
    badgeColor: '',
  },
];

// ---------------------------------------------------------------------------
// PaymentMethodCard
// ---------------------------------------------------------------------------
const PaymentMethodCard = ({ method, selected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(method.id)}
      aria-pressed={selected}
      className={[
        'flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2',
        selected
          ? 'border-gray-900 bg-gray-900 text-white shadow-md dark:border-yellow-500 dark:bg-yellow-500 dark:text-gray-900'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm',
      ].join(' ')}
    >
      {/* Radio circle */}
      <span
        className={[
          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-white dark:border-gray-900' : 'border-gray-400 dark:border-gray-500',
        ].join(' ')}
        aria-hidden="true"
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
      </span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{method.label}</span>
          {method.badge && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${method.badgeColor} ${selected ? 'bg-green-200 text-green-800' : ''}`}>
              {method.badge}
            </span>
          )}
        </div>
        <p className={`mt-0.5 text-xs ${selected ? 'text-gray-300 dark:text-gray-700' : 'text-gray-500 dark:text-gray-400'}`}>
          {method.subtitle}
        </p>
      </div>

      {/* Method icons */}
      <div className="flex flex-shrink-0 items-center gap-1.5">
        {method.icons.map((Icon, i) => (
          <Icon
            key={i}
            size={18}
            className={selected ? 'text-gray-300 dark:text-gray-700' : 'text-gray-400 dark:text-gray-500'}
            aria-hidden="true"
          />
        ))}
      </div>
    </button>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
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
    paymentMethod: 'upi',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      deliveryAddress: prev.deliveryAddress || user.address || '',
      phoneNumber: prev.phoneNumber || user.phoneNumber || '',
    }));
  }, [user]);

  if (!onlineStatus) return <Offline />;

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <span className="sr-only" role="status">Loading checkout</span>
        <div className="space-y-4" aria-hidden="true">
          <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-12 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">You're not signed in</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-gray-600 dark:text-gray-400">
            Log in to confirm your delivery address and place this order. Your cart is saved.
          </p>
          <Button size="lg" className="mt-7" onClick={() => navigate('/login', { state: { from: '/checkout' } })}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-12 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your cart is empty</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-gray-600 dark:text-gray-400">Add a few dishes before checking out.</p>
          <Button size="lg" className="mt-7" onClick={() => navigate('/')}>Browse restaurants</Button>
        </div>
      </div>
    );
  }

  const { totalItems, itemSubtotal: subtotal, gst, platformFee, deliveryFee, total } =
    calculateOrderTotals(cartItems);

  const validateForm = () => {
    const next = {};
    if (!formData.deliveryAddress.trim()) next.deliveryAddress = 'Delivery address is required';
    if (!formData.phoneNumber.trim()) {
      next.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      next.phoneNumber = 'Please enter a valid phone number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const placeOrderInFirestore = async (paymentDetails = {}) => {
    const userData = { ...user, phoneNumber: formData.phoneNumber };
    const restaurantInfo = {
      id: cartItems[0]?.card?.restaurantId || '',
      name: cartItems[0]?.card?.restaurantName || 'Unknown Restaurant',
    };
    const orderData = createOrder(
      cartItems, userData, formData.deliveryAddress,
      formData.specialInstructions, restaurantInfo, formData.paymentMethod
    );
    const estimatedDelivery = new Date(Date.now() + 35 * 60000);
    const ordersRef = collection(db, 'orders', user.uid, 'orders');
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      ...paymentDetails,
      createdAt: serverTimestamp(),
      estimatedDelivery,
    });
    if (!docRef?.id) throw new Error('Failed to create order — no ID returned');
    return { docRef, orderData, estimatedDelivery };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { notify.warning('Please fill all required fields correctly'); return; }

    setSubmitting(true);
    const isCOD = formData.paymentMethod === 'cod';
    const toastId = notify.loading(isCOD ? 'Placing your order…' : 'Opening payment…');

    try {
      let paymentDetails = {};

      if (!isCOD) {
        // Dismiss loading toast before Razorpay modal opens so it doesn't
        // linger behind the overlay.
        updateNotification(toastId, { render: 'Complete payment to confirm order', type: 'info', isLoading: false, autoClose: 2500 });

        const selectedMethod = PAYMENT_METHODS.find((m) => m.id === formData.paymentMethod);
        const response = await openRazorpayCheckout({
          amount: total,
          name: 'Swadify',
          description: `Order from ${cartItems[0]?.card?.restaurantName || 'restaurant'}`,
          prefill: { name: user.displayName || '', email: user.email || '', contact: formData.phoneNumber },
          method: selectedMethod?.razorpayMethod,
        });
        paymentDetails = {
          razorpay_payment_id: response.razorpay_payment_id,
          paymentStatus: 'paid',
        };
        notify.loading('Confirming your order…');
      }

      const { docRef, orderData, estimatedDelivery } = await placeOrderInFirestore(paymentDetails);

      dispatch(setCurrentOrder({
        ...orderData,
        ...paymentDetails,
        id: docRef.id,
        estimatedDelivery: estimatedDelivery.toISOString(),
        createdAt: new Date().toISOString(),
      }));
      dispatch(clearCart());
      queryClient.invalidateQueries({ queryKey: orderHistoryKey(user.uid) });

      updateNotification(toastId, { render: 'Order placed successfully!', type: 'success', isLoading: false, autoClose: 1500 });
      navigate(`/order-confirmation/${docRef.id}`);

    } catch (error) {
      setSubmitting(false);
      if (error.message === 'Payment cancelled') {
        updateNotification(toastId, { render: 'Payment cancelled — your cart is still saved.', type: 'info', isLoading: false, autoClose: 4000 });
        return;
      }
      const isFirestoreError = error?.code?.startsWith?.('firestore') || error?.name === 'FirebaseError';
      const message = isFirestoreError
        ? describeFirestoreError(error, 'your order').message
        : (error.message || 'Something went wrong. Please try again.');
      updateNotification(toastId, { render: message, type: 'error', isLoading: false, autoClose: 6000 });
    }
  };

  const selectedMethodDef = PAYMENT_METHODS.find((m) => m.id === formData.paymentMethod);
  const isCOD = formData.paymentMethod === 'cod';

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ── Left column: form ── */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* Order items */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">Your Order</h2>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4">
                <ItemList items={cartItems} inCart readOnly />
              </div>
            </section>

            {/* Delivery */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">Delivery Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="delivery-address" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Delivery address <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <textarea
                    id="delivery-address" name="deliveryAddress" rows="3" maxLength="500"
                    required aria-required="true"
                    aria-invalid={!!errors.deliveryAddress}
                    aria-describedby={errors.deliveryAddress ? 'address-error' : undefined}
                    value={formData.deliveryAddress} onChange={handleInputChange}
                    placeholder="House / street / area, city, PIN"
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-yellow-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 ${errors.deliveryAddress ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'}`}
                  />
                  {errors.deliveryAddress && <p id="address-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.deliveryAddress}</p>}
                </div>
                <div>
                  <label htmlFor="phone-number" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Phone number <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="phone-number" type="tel" name="phoneNumber" required aria-required="true"
                    aria-invalid={!!errors.phoneNumber}
                    aria-describedby={errors.phoneNumber ? 'phone-error' : undefined}
                    value={formData.phoneNumber} onChange={handleInputChange}
                    placeholder="+91 XXXXXXXXXX"
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-yellow-500 dark:text-gray-100 dark:placeholder-gray-500 ${errors.phoneNumber ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'}`}
                  />
                  {errors.phoneNumber && <p id="phone-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phoneNumber}</p>}
                </div>
                <div>
                  <label htmlFor="special-instructions" className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Special instructions <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                  </label>
                  <textarea
                    id="special-instructions" name="specialInstructions" rows="2" maxLength="300"
                    value={formData.specialInstructions} onChange={handleInputChange}
                    placeholder="e.g. No onions, extra spicy, ring the bell"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 px-4 py-3 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-yellow-500"
                  />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm sm:p-6">
              <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">Payment Method</h2>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">All transactions are secured and encrypted.</p>
              <div className="space-y-2.5" role="radiogroup" aria-label="Choose a payment method">
                {PAYMENT_METHODS.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    selected={formData.paymentMethod === method.id}
                    onSelect={(id) => setFormData((prev) => ({ ...prev, paymentMethod: id }))}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <FiShield size={13} aria-hidden="true" />
                <span>Powered by Razorpay · 256-bit SSL encryption</span>
              </div>
            </section>

            {/* CTA */}
            <Button type="submit" size="xl" fullWidth disabled={submitting} aria-busy={submitting}>
              {submitting ? (
                'Processing…'
              ) : isCOD ? (
                <>Place Order · ₹{total.toFixed(2)}</>
              ) : (
                <><FiLock size={18} aria-hidden="true" /> Pay ₹{total.toFixed(2)} securely</>
              )}
            </Button>

          </form>
        </div>

        {/* ── Right column: order summary ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4 md:top-20">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">Order Summary</h2>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <dt>Items ({totalItems})</dt>
                  <dd className="tabular-nums">₹{subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <dt>GST (5%)</dt>
                  <dd className="tabular-nums">₹{gst.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <dt>Platform fee</dt>
                  <dd className="tabular-nums">₹{platformFee.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2.5 text-gray-600 dark:text-gray-400">
                  <dt>Delivery</dt>
                  <dd className="tabular-nums">₹{deliveryFee.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between rounded-xl bg-gray-900 dark:bg-yellow-500 px-4 py-3 text-base font-bold text-white dark:text-gray-900">
                  <dt>Total</dt>
                  <dd className="tabular-nums">₹{total.toFixed(2)}</dd>
                </div>
              </dl>
            </div>

            {/* Delivery estimate */}
            <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Estimated delivery</p>
              <p className="mt-0.5 text-sm text-blue-700 dark:text-blue-400">30–45 minutes</p>
            </div>

            {/* Payment badge */}
            {!isCOD && (
              <div className="flex items-center gap-3 rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
                <FiShield className="flex-shrink-0 text-green-600 dark:text-green-400" size={20} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">Secure checkout</p>
                  <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">Payments processed by Razorpay</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
