import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useOnlineStatus from '../utils/useOnlineStatus';
import Offline from './Offline';
import ErrorState from '../components/ErrorState';
import { describeFirestoreError } from '../utils/firestoreErrors';
import { FiCheckCircle, FiCopy, FiCheck } from 'react-icons/fi';
import Button from '../components/Button';

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTime = (value) => {
  const date = toDate(value);
  // The old version fed `undefined` straight into `new Date(...)` and rendered
  // the literal string "Invalid Date" on the confirmation screen.
  if (!date) return 'Being scheduled';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const user = useSelector((store) => store.user.user);
  const authLoading = useSelector((store) => store.user.isLoading);
  const currentOrder = useSelector((store) => store.orders.currentOrder);
  const onlineStatus = useOnlineStatus();
  const [copied, setCopied] = useState(false);

  /*
   * Redux holds the order only for the tab that just placed it. Refreshing this
   * page, or opening the link again later, wiped `currentOrder` and the screen
   * showed "Order Not Found" for an order that had in fact been placed
   * successfully. The document id is right there in the URL, so fall back to
   * reading it.
   */
  const fromRedux = currentOrder?.id === orderId ? currentOrder : null;
  const [fetched, setFetched] = useState(null);
  const [fetchState, setFetchState] = useState('idle');
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (fromRedux || !user?.uid || !orderId) return;

    let cancelled = false;
    setFetchState('loading');

    getDoc(doc(db, 'orders', user.uid, 'orders', orderId))
      .then((snapshot) => {
        if (cancelled) return;
        setFetched(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null);
        setFetchState('done');
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Could not load order:', error);
        setFetchError(describeFirestoreError(error, 'your order'));
        setFetchState('done');
      });

    return () => {
      cancelled = true;
    };
  }, [fromRedux, user?.uid, orderId]);

  if (!onlineStatus) {
    return <Offline />;
  }

  // The auth session restores asynchronously; without this gate a refresh tells
  // a signed-in user their session expired.
  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <span className="sr-only" role="status">
          Loading your order
        </span>
        <div className="space-y-4" aria-hidden="true">
          <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="mx-auto h-8 w-2/3 animate-pulse rounded bg-gray-200" />
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
            Log in to view this order confirmation.
          </p>
          <Button
            size="lg"
            className="mt-7"
            onClick={() => navigate('/login', { state: { from: `/order-confirmation/${orderId}` } })}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const order = fromRedux || fetched;

  if (!order && fetchState === 'loading') {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <span className="sr-only" role="status">
          Loading your order
        </span>
        <div className="space-y-4" aria-hidden="true">
          <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        {fetchError ? (
          <ErrorState errorInfo={fetchError} />
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-gray-600">
              We couldn't find this order on your account. It may belong to a different
              account.
            </p>
            <Button size="lg" className="mt-7" onClick={() => navigate('/profile')}>
              View order history
            </Button>
          </div>
        )}
      </div>
    );
  }

  const handleCopyOrderId = async () => {
    try {
      // Rejects outside a secure context and is absent in some in-app browsers;
      // unhandled, that surfaced as a console error on click.
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Nothing actionable — the id is selectable text right next to the button.
    }
  };

  const money = (value) => `₹${(Number(value) || 0).toFixed(2)}`;

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white px-4 pb-28 pt-10 sm:pt-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-10 text-center">
          <div className="mb-5 flex justify-center">
            <FiCheckCircle className="text-green-500" size={72} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Order Confirmed!</h1>
          <p className="mx-auto mt-3 max-w-md text-base text-gray-600 sm:text-lg">
            Thank you for your order. Your food is on the way.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order ID</p>
            <div className="mt-2 flex items-center gap-3">
              <code className="min-w-0 flex-1 break-all rounded bg-gray-100 px-3 py-2 font-mono text-sm text-gray-900 sm:text-base">
                {order.id}
              </code>
              <button
                type="button"
                onClick={handleCopyOrderId}
                aria-label={copied ? 'Order ID copied' : 'Copy order ID'}
                className="flex-shrink-0 rounded-lg p-2.5 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
              >
                {copied ? (
                  <FiCheck className="text-green-600" size={20} aria-hidden="true" />
                ) : (
                  <FiCopy className="text-gray-500" size={20} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 border-b border-gray-200 pb-8 sm:grid-cols-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Restaurant
              </p>
              <p className="mt-1 break-words text-lg font-semibold text-gray-900">
                {order.restaurantName || 'Restaurant'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Estimated delivery
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatTime(order.estimatedDelivery)}
              </p>
              <p className="text-sm text-gray-600">(30–45 minutes)</p>
            </div>
          </div>

          {order.items?.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Order items</h2>
              <ul className="space-y-3">
                {order.items.map((item, idx) => (
                  <li
                    key={item.itemId ?? idx}
                    className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="flex-shrink-0 font-semibold tabular-nums text-gray-900">
                      {money(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-8 border-b border-gray-200 pb-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Delivery address
            </p>
            <p className="mt-1 break-words text-gray-900">{order.deliveryAddress}</p>
          </div>

          {/*
            Every component of the bill is listed. The previous version showed
            only `order.subtotal` — a field that does not exist on the order
            document (it is `itemSubtotal`), so it rendered ₹0.00 — plus a
            delivery fee that fell back to a hardcoded ₹50 when the real fee is
            ₹40, and omitted GST and the platform fee entirely. The result was a
            summary whose lines could not be reconciled with its own total.
          */}
          <dl className="space-y-2.5">
            <div className="flex justify-between text-sm text-gray-700">
              <dt>Item total</dt>
              <dd className="tabular-nums">{money(order.itemSubtotal)}</dd>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <dt>GST (5%)</dt>
              <dd className="tabular-nums">{money(order.gst)}</dd>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <dt>Platform fee (5%)</dt>
              <dd className="tabular-nums">{money(order.platformFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2.5 text-sm text-gray-700">
              <dt>Delivery fee</dt>
              <dd className="tabular-nums">{money(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-base font-bold text-gray-900 ring-1 ring-gray-200">
              <dt>Grand total</dt>
              <dd className="tabular-nums">{money(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
          <h2 className="mb-3 font-semibold text-blue-900">What's next?</h2>
          <ol className="list-inside list-decimal space-y-2 text-sm text-blue-900 sm:text-base">
            <li>Your order is confirmed and being prepared</li>
            <li>Track its status any time from your profile</li>
            <li>Pay cash when it arrives</li>
          </ol>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="flex-1" onClick={() => navigate('/profile')}>
            Track order
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => navigate('/')}
          >
            Continue shopping
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
