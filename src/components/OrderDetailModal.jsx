import { useEffect, useRef } from 'react';
import { getStatusLabel, getStatusColor } from '../utils/orderUtils';
import { FiX } from 'react-icons/fi';
import Button from './Button';

const formatOrderDate = (value) => {
  // `useOrderHistory` normalises Firestore Timestamps to Date objects, and the
  // order is handed straight to this component, so no `.toDate()` juggling here.
  if (!(value instanceof Date)) return 'Date unavailable';
  return value.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const money = (value) => `₹${(Number(value) || 0).toFixed(2)}`;

/*
  `order` arrives as a prop rather than being read from Redux. These orders hold
  Date instances, which are not serialisable and therefore have no business in
  the store; the parent renders this component only when an order is open, so
  the prop is always present.
*/
const OrderDetailModal = ({ order, onClose, onReorder }) => {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  const isOpen = Boolean(order);

  /*
   * Escape to dismiss, and the background is locked from scrolling while the
   * dialog is up. Neither existed before: the only way out was the mouse, and
   * scrolling the overlay scrolled the page behind it.
   */
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      // Focus trap. Without it, tabbing walked out of the dialog and into the
      // page behind, which for a screen-reader user made the modal effectively
      // inescapable and unreadable.
      if (event.key !== 'Tab') return;

      const focusables = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      // Return focus to whatever opened the dialog.
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = order.items || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      // Clicking the backdrop dismisses, matching every other modal users meet.
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4 sm:px-6">
          <h2 id="order-detail-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
            Order Details
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="flex-shrink-0 rounded-lg p-2 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
          >
            <FiX size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Order ID
              </p>
              <p className="mt-1 break-all font-mono text-sm text-gray-900 dark:text-gray-100">{order.id}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
              <span
                className={`mt-1 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Restaurant
              </p>
              <p className="mt-1 break-words font-semibold text-gray-900 dark:text-gray-100">
                {order.restaurantName || 'Restaurant'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Order date
              </p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                {formatOrderDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Delivery information</h3>
            <div className="space-y-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Address
                </p>
                <p className="mt-0.5 break-words text-gray-900 dark:text-gray-200">
                  {order.deliveryAddress || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Phone
                </p>
                <p className="mt-0.5 text-gray-900 dark:text-gray-200">{order.phoneNumber || '—'}</p>
              </div>
              {order.specialInstructions && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Special instructions
                  </p>
                  <p className="mt-0.5 break-words text-gray-900 dark:text-gray-200">{order.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Items ordered</h3>
              <ul className="space-y-3">
                {items.map((item, idx) => (
                  <li
                    key={item.itemId ?? idx}
                    className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-700 py-2 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.category}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                      <p className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                        {money(item.price * item.quantity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <dl className="space-y-2.5 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
              <dt>Item total</dt>
              <dd className="tabular-nums">{money(order.itemSubtotal)}</dd>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <dt>GST (5%)</dt>
              <dd className="tabular-nums">{money(order.gst)}</dd>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <dt>Platform fee (5%)</dt>
              <dd className="tabular-nums">{money(order.platformFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2.5 text-sm text-gray-700 dark:text-gray-300">
              <dt>Delivery fee</dt>
              <dd className="tabular-nums">{money(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-base font-bold text-gray-900 dark:text-gray-100 ring-1 ring-gray-200 dark:ring-gray-600">
              <dt>Grand total</dt>
              <dd className="tabular-nums">{money(order.total)}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 border-t border-gray-200 dark:border-gray-700 pt-6 sm:flex-row">
            <Button
              className="flex-1"
              onClick={() => {
                onReorder(order);
                onClose();
              }}
            >
              Reorder
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
