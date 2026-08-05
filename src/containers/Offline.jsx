import { FiWifiOff } from 'react-icons/fi';

const Offline = () => {
  return (
    <section
      // `alert` so the state change is announced — the connection can drop while
      // the user is mid-task, replacing the page with no other signal.
      role="alert"
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <FiWifiOff className="text-gray-600" size={26} aria-hidden="true" />
      </div>

      <h1 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">
        Oops! You&rsquo;re offline
      </h1>
      <p className="mt-3 text-base text-gray-600">
        Please check your internet connection. This page will recover on its own once
        you&rsquo;re back online.
      </p>
    </section>
  );
};

export default Offline;
