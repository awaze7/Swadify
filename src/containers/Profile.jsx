import { useSelector } from 'react-redux';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { FiUser, FiShoppingBag } from 'react-icons/fi';
import useOnlineStatus from '../utils/useOnlineStatus';
import Offline from './Offline';
import { buttonClasses } from '../components/Button';

const TAB_CLASSES = ({ isActive }) =>
  `flex items-center gap-2 border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-yellow-400 focus-visible:ring-offset-2 ${
    isActive
      ? 'border-gray-900 dark:border-yellow-400 text-gray-900 dark:text-yellow-400'
      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
  }`;

const Profile = () => {
  const user = useSelector((store) => store.user.user);
  const authLoading = useSelector((store) => store.user.isLoading);
  const onlineStatus = useOnlineStatus();

  if (!onlineStatus) return <Offline />;

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <span className="sr-only" role="status">Loading your profile</span>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm" aria-hidden="true">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="h-28 w-28 flex-shrink-0 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700 sm:h-32 sm:w-32" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-16 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <FiUser className="text-gray-400 dark:text-gray-500" size={30} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900 dark:text-gray-100">You're not signed in</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-gray-600 dark:text-gray-400">
            Log in to view your profile, track orders and reorder your favourites.
          </p>
          <Link to="/login" className={buttonClasses({ size: 'lg', className: 'mt-7' })}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-8">
      {/* Page title */}
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">My Account</h1>

      {/* Tab bar */}
      <nav
        aria-label="Profile sections"
        className="mb-6 border-b border-gray-200 dark:border-gray-700"
      >
        <ul className="flex gap-6" role="list">
          <li>
            <NavLink
              to="/profile"
              end
              className={TAB_CLASSES}
            >
              <FiUser size={16} aria-hidden="true" />
              Profile
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/profile/orders"
              className={TAB_CLASSES}
            >
              <FiShoppingBag size={16} aria-hidden="true" />
              My Orders
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Active tab content */}
      <Outlet />
    </div>
  );
};

export default Profile;
