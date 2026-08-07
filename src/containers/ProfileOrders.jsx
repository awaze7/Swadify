import { useSelector } from 'react-redux';
import OrderHistorySection from '../components/OrderHistorySection';
import useOrderHistory from '../utils/useOrderHistory';

const ProfileOrders = () => {
  const user = useSelector((store) => store.user.user);
  const { orders, isLoading, isRefreshing, isEmpty, errorInfo, refetch } = useOrderHistory(
    user?.uid
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm sm:p-8">
      <OrderHistorySection
        orders={orders}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        isEmpty={isEmpty}
        errorInfo={errorInfo}
        onRetry={refetch}
      />
    </div>
  );
};

export default ProfileOrders;
