import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addItem } from "../utils/Redux/cartSlice";
import { getStatusLabel, getStatusColor } from "../utils/orderUtils";
import { notify } from "../utils/notificationUtils";
import { FiChevronRight, FiRepeat, FiRefreshCw, FiChevronDown } from "react-icons/fi";
import OrderDetailModal from "./OrderDetailModal";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import Button from "./Button";

const PAGE_SIZE = 5;

/** Lightweight inline illustration for the "no orders yet" state. */
const NoOrdersIllustration = () => (
  <svg width="112" height="96" viewBox="0 0 112 96" fill="none" role="presentation">
    {/* Plate */}
    <ellipse cx="56" cy="78" rx="38" ry="7" fill="#F3F4F6" />
    {/* Bag body */}
    <path
      d="M30 30h52l-4.5 44a6 6 0 0 1-6 5.4H40.5a6 6 0 0 1-6-5.4L30 30Z"
      fill="#FEF3C7"
      stroke="#F59E0B"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Bag handles */}
    <path
      d="M43 30v-6a13 13 0 0 1 26 0v6"
      stroke="#F59E0B"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Fork + knife, faint */}
    <path d="M49 47v18M49 47c-2 0-3 1.5-3 4s1 4 3 4" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
    <path d="M63 47v18M63 47c2 0 3 1.5 3 4s-1 4-3 4" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/*
 * Mirrors the real order card's box model rather than approximating it: the same
 * `px-5 pt-5` header, the same `mt-4` metric row, and — the part that was missing
 * — the bordered Reorder footer. Without that footer the placeholder was about
 * 68px shorter per card, so the list jumped upward by roughly 200px the moment
 * three real orders arrived.
 */
const OrderSkeleton = () => (
  <ul className="space-y-4" aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <li key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="h-6 w-2/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-0.5 h-5 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="h-6 w-20 flex-shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>

          <div className="mt-4 flex items-center gap-6">
            {[0, 1].map((col) => (
              <div key={col}>
                <div className="h-4 w-10 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                <div className="mt-0.5 h-6 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
            <div className="ml-auto h-5 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 dark:border-gray-700 px-5 py-3">
          <div className="h-11 w-28 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
        </div>
      </li>
    ))}
  </ul>
);

const formatOrderDate = (createdAt) => {
  // `useOrderHistory` already normalises Firestore Timestamps to Date objects.
  if (!(createdAt instanceof Date)) return "Date unavailable";
  return createdAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OrderHistorySection = ({
  orders,
  isLoading,
  isRefreshing,
  isEmpty,
  errorInfo,
  onRetry,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);
  // Start at PAGE_SIZE; each "Load more" adds another PAGE_SIZE.
  // Resets to PAGE_SIZE whenever a fresh orders array lands (tab remounts).
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleOrders = orders.slice(0, visibleCount);
  const hasMore = visibleCount < orders.length;

  const handleViewDetails = useCallback((order) => {
    setSelectedOrder(order);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedOrder(null);
  }, []);

  const handleReorder = useCallback(
    (order) => {
      const validItems = (order?.items || []).filter((item) => item?.itemId && item?.name);

      if (validItems.length === 0) {
        notify.warning("These items are no longer available to reorder.");
        return;
      }

      validItems.forEach((item) => {
        dispatch(
          addItem({
            card: {
              // Carried through so a reordered cart still knows which restaurant
              // it came from; without it, checking out a reorder wrote the new
              // order back as "Unknown Restaurant".
              restaurantId: order.restaurantId || "",
              restaurantName: order.restaurantName || "",
              info: {
                id: item.itemId,
                name: item.name,
                price: item.price || 0,
                defaultPrice: item.price || 0,
                category: item.category || "General",
              },
            },
            // One dispatch per line rather than one per unit — reordering a
            // quantity of 5 used to fire five separate dispatches and five
            // re-renders.
            quantity: item.quantity || 1,
          })
        );
      });

      const skipped = (order?.items?.length || 0) - validItems.length;
      notify.success(
        skipped > 0
          ? `${validItems.length} item${validItems.length === 1 ? "" : "s"} added — ${skipped} unavailable`
          : `${validItems.length} item${validItems.length === 1 ? "" : "s"} added to your cart`
      );
      navigate("/cart");
    },
    [dispatch, navigate]
  );

  const heading = (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 id="order-history-heading" className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
        Order History
      </h2>
      {/* Background revalidation indicator — never replaces the list. */}
      {isRefreshing && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          <FiRefreshCw size={13} className="animate-spin" aria-hidden="true" />
          Updating
        </span>
      )}
    </div>
  );

  const renderBody = () => {
    // 1. Loading — first load only, never shown over cached data.
    if (isLoading) {
      return (
        <>
          <span className="sr-only" role="status">
            Loading your order history
          </span>
          <OrderSkeleton />
        </>
      );
    }

    // 2. Genuine failure — classified and actionable.
    if (errorInfo) {
      return <ErrorState errorInfo={errorInfo} onRetry={onRetry} isRetrying={isRefreshing} />;
    }

    // 3. Empty — a valid, expected state. No error styling, no notification.
    if (isEmpty) {
      return (
        <EmptyState
          illustration={<NoOrdersIllustration />}
          title="No orders yet"
          description="When you place your first order, it'll appear here so you can track it and reorder in one tap."
          actionLabel="Browse restaurants"
          actionTo="/"
        />
      );
    }

    // 4. Data.
    return (
      <>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
          Showing {visibleOrders.length} of {orders.length}{" "}
          {orders.length === 1 ? "order" : "orders"}
        </p>
        <ul className="space-y-4">
        {visibleOrders.map((order) => (
          <li
            key={order.id}
            className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-150 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
          >
            {/*
              A single button owns the "open details" affordance. The card used to
              be a div with onClick, which meant keyboard and screen-reader users
              could not open an order at all. Reorder is a sibling, not a nested
              button, so the markup stays valid.
            */}
            <button
              type="button"
              onClick={() => handleViewDetails(order)}
              aria-label={`View details for your ${order.restaurantName || "restaurant"} order on ${formatOrderDate(order.createdAt)}`}
              className="w-full rounded-t-2xl px-5 pt-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-500"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-gray-900 dark:text-gray-100">
                    {order.restaurantName || "Unknown Restaurant"}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {formatOrderDate(order.createdAt)}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <dl className="mt-4 flex items-center gap-6">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Items</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {order.items?.length || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    ₹{(order.total || 0).toFixed(2)}
                  </dd>
                </div>
                <span className="ml-auto flex items-center gap-1 text-sm font-medium text-gray-400 dark:text-gray-500 transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-300">
                  Details
                  <FiChevronRight size={16} aria-hidden="true" />
                </span>
              </dl>
            </button>

            <div className="mt-4 border-t border-gray-100 dark:border-gray-700 px-5 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReorder(order)}
                aria-label={`Reorder from ${order.restaurantName || "this restaurant"}`}
              >
                <FiRepeat size={15} aria-hidden="true" />
                Reorder
              </Button>
            </div>
          </li>
        ))}
        </ul>

        {hasMore && (
          <div className="mt-6 flex flex-col items-center gap-1.5">
            <Button
              variant="secondary"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              <FiChevronDown size={16} aria-hidden="true" />
              Load more orders
            </Button>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {orders.length - visibleCount} more to show
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <section aria-labelledby="order-history-heading">
      {/*
        The id lives on the <h2> itself, not on this wrapper. When it was on the
        wrapper, the "Updating" revalidation indicator was inside the labelled
        element, so the section's accessible name intermittently became
        "Order History Updating".
      */}
      {heading}
      {renderBody()}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={handleCloseDetails}
          onReorder={handleReorder}
        />
      )}
    </section>
  );
};

export default OrderHistorySection;
