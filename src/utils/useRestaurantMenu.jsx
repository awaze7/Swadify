import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  classifyFirestoreError,
  describeFirestoreError,
  isRetryableKind,
} from "./firestoreErrors";

export const restaurantMenuKey = (resId) => ["restaurantMenu", String(resId)];

/**
 * A restaurant with no menu document is a real, reportable state and stays on the
 * success path — it is not the same as being unable to ask.
 */
const fetchRestaurantMenu = async (resId) => {
  const snapshot = await getDoc(doc(db, "menus", String(resId)));
  if (!snapshot.exists()) return { notFound: true };
  return snapshot.data();
};

/**
 * Menu for a single restaurant.
 *
 * Was hand-rolled useState/useEffect, which had no error branch at all: a failed
 * read left `resInfo` as null forever, indistinguishable from "still loading", so
 * RestaurantMenu rendered its shimmer indefinitely with no message and no way to
 * retry. Routing it through TanStack Query also brings the race safety the manual
 * `isCurrent` flag was approximating, plus caching between visits.
 */
const useRestaurantMenu = (resId) => {
  const { data, error, isError, isPending, isFetching, refetch } = useQuery({
    queryKey: restaurantMenuKey(resId),
    queryFn: () => fetchRestaurantMenu(resId),
    enabled: Boolean(resId),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: (failureCount, err) =>
      isRetryableKind(classifyFirestoreError(err)) && failureCount < 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  const notFound = data?.notFound === true;

  return {
    // Null while loading or on failure, so existing destructuring of menu fields
    // keeps working unchanged.
    resInfo: notFound ? null : data ?? null,
    isLoading: Boolean(resId) && isPending && !isError,
    isRefreshing: isFetching && !isPending,
    isError,
    errorInfo: isError ? describeFirestoreError(error, "this menu") : null,
    // "This restaurant has no menu yet" — a success, not a failure.
    notFound,
    refetch,
  };
};

export default useRestaurantMenu;
