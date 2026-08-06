import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import useOnlineStatus from '../utils/useOnlineStatus';
import Offline from './Offline';
import ProfileHeader from '../components/ProfileHeader';
import OrderHistorySection from '../components/OrderHistorySection';
import ProfileActions from '../components/ProfileActions';
import useOrderHistory from '../utils/useOrderHistory';
import useLogout from '../utils/useLogout';
import { buttonClasses } from '../components/Button';

const Profile = () => {
  const user = useSelector((store) => store.user.user);
  const authLoading = useSelector((store) => store.user.isLoading);
  const onlineStatus = useOnlineStatus();
  const { logout, isLoggingOut } = useLogout();

  const [isEditing, setIsEditing] = useState(false);

  /*
   * No error toast here any more.
   *
   * This page used to fire `notify.error('Failed to load order history…')` from an
   * effect keyed on the hook's error value. Two things were wrong with that:
   * every failure produced the same generic message regardless of cause, and the
   * toast auto-dismissed after 1.5s leaving an unexplained blank region behind.
   * Error presentation now lives inline in OrderHistorySection, which can tell a
   * network blip apart from a permissions problem — and, critically, treats a
   * zero-order result as an empty state rather than a failure.
   */
  const { orders, isLoading, isRefreshing, isEmpty, errorInfo, refetch } = useOrderHistory(
    user?.uid
  );

  if (!onlineStatus) {
    return <Offline />;
  }

  // The Firebase session restores asynchronously on a fresh page load. Without
  // this gate the page would flash "Please Log In" at an already-signed-in user
  // before the listener resolves.
  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <span className="sr-only" role="status">
          Loading your profile
        </span>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row" aria-hidden="true">
            {/* Tracks Avatar's `xl` box (w-28 h-28 sm:w-32 sm:h-32); a flat
                h-32 was 16px too tall on mobile. */}
            <div className="h-28 w-28 flex-shrink-0 animate-pulse rounded-2xl bg-gray-200 sm:h-32 sm:w-32" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
              <div className="h-16 w-full animate-pulse rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FiUser className="text-gray-400" size={30} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900">You're not signed in</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-gray-600">
            Log in to view your profile, track orders and reorder your favourites.
          </p>
          <Link to="/login" className={buttonClasses({ size: "lg", className: "mt-7" })}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <ProfileHeader
          user={user}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          orderCount={orders.length}
          orderCountKnown={!isLoading && !errorInfo}
        />

        <hr className="my-8 border-gray-200" />

        <OrderHistorySection
          orders={orders}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          isEmpty={isEmpty}
          errorInfo={errorInfo}
          onRetry={refetch}
        />

        <hr className="my-8 border-gray-200" />

        <ProfileActions onLogout={logout} isLoggingOut={isLoggingOut} />
      </div>
    </div>
  );
};

export default Profile;
