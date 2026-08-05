import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import {
  classifyFirestoreError,
  describeFirestoreError,
  isRetryableKind,
} from "./firestoreErrors";

export const orderHistoryKey = (userId) => ["orderHistory", userId];

/**
 * Normalises a Firestore order doc into something the UI can render without
 * repeating `createdAt?.toDate?.()` guards at every call site.
 */
const normalizeOrder = (doc) => {
  const data = doc.data();
  const toDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  return {
    ...data,
    id: doc.id,
    createdAt: toDate(data.createdAt),
    estimatedDelivery: toDate(data.estimatedDelivery),
  };
};

const fetchOrderHistory = async (userId) => {
  const ordersRef = collection(db, "orders", userId, "orders");
  const snapshot = await getDocs(query(ordersRef, orderBy("createdAt", "desc")));
  // An empty snapshot is a completely valid result, not an error. It resolves
  // to [] and never touches the error path.
  return snapshot.docs.map(normalizeOrder);
};

/**
 * Order history for a user.
 *
 * Built on TanStack Query rather than raw useState/useEffect because this
 * particular fetch needs three things the hand-rolled version got wrong:
 *
 * 1. Race safety — the old version had no cancellation, so a slow response for
 *    user A could land after a fast response for user B and overwrite it.
 * 2. Error-aware retries — a transient `unavailable` deserves a retry with
 *    backoff; a `permission-denied` never will succeed and must fail fast.
 * 3. Caching — navigating away from and back to Profile re-read the whole
 *    collection every time, which is billable. Now it serves from cache and
 *    revalidates in the background.
 */
const useOrderHistory = (userId) => {
  const queryResult = useQuery({
    queryKey: orderHistoryKey(userId),
    queryFn: () => fetchOrderHistory(userId),
    // Without a uid there is nothing to fetch. The query stays idle instead of
    // reporting a spurious error.
    enabled: Boolean(userId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) =>
      isRetryableKind(classifyFirestoreError(error)) && failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  const { data, error, isError, isPending, isFetching, refetch, status } = queryResult;
  const orders = data ?? [];

  // `isPending` is true while the query is disabled, which would otherwise keep
  // the profile stuck on a skeleton for a logged-out visitor forever.
  const isLoading = Boolean(userId) && isPending && !isError;

  return {
    orders,
    isLoading,
    // Distinguishes "first load" from "silently revalidating cached data" so the
    // UI can show a subtle indicator instead of tearing down the list.
    isRefreshing: isFetching && !isLoading,
    isError,
    error,
    // Pre-classified, user-facing copy. Null unless there is a genuine failure.
    errorInfo: isError ? describeFirestoreError(error, "your order history") : null,
    // Only "empty" once we actually know the collection is empty.
    isEmpty: status === "success" && orders.length === 0,
    refetch,
  };
};

export default useOrderHistory;
