import User from '../components/User';
import { useSelector } from 'react-redux';
import useOnlineStatus from "../utils/useOnlineStatus";
import Offline from "./Offline";

const About = () => {
  const userName = useSelector((store) => store.user?.user?.displayName || "User");
  const onlineStatus = useOnlineStatus();

  if (!onlineStatus) {
    return <Offline />;
  }

  return (
    <div className="mx-auto my-8 max-w-5xl rounded-lg bg-white p-5 text-sm shadow-lg sm:p-8">
      <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">About Swadify</h1>
      <p className="mb-2 text-base">
        Hello <span className="font-semibold">{userName}!</span>
      </p>
      <p className="text-gray-800 mb-6">
        Welcome to Swadify - your go-to platform for exploring and enjoying delicious meals!
        Our mission is to provide a seamless and delightful experience for food enthusiasts
        to discover the best restaurants and savor their favorite cuisines.
      </p>
      <User />
    </div>
  );
}

export default About;
