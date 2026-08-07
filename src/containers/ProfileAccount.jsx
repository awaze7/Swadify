import { useState } from 'react';
import { useSelector } from 'react-redux';
import ProfileHeader from '../components/ProfileHeader';
import ProfileActions from '../components/ProfileActions';
import useLogout from '../utils/useLogout';
import useOrderHistory from '../utils/useOrderHistory';

const ProfileAccount = () => {
  const user = useSelector((store) => store.user.user);
  const { logout, isLoggingOut } = useLogout();
  const [isEditing, setIsEditing] = useState(false);

  // Order count shown in the ProfileHeader stat tile — fetched here so the
  // header can display it without the Orders tab needing to be visited first.
  const { orders, isLoading: ordersLoading, errorInfo } = useOrderHistory(user?.uid);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm sm:p-8">
        <ProfileHeader
          user={user}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          orderCount={orders.length}
          orderCountKnown={!ordersLoading && !errorInfo}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm sm:p-8">
        <ProfileActions onLogout={logout} isLoggingOut={isLoggingOut} />
      </div>
    </div>
  );
};

export default ProfileAccount;
