import { useState, useEffect } from "react";

const getInitialStatus = () =>
  typeof navigator === "undefined" || typeof navigator.onLine !== "boolean"
    ? true
    : navigator.onLine;

/**
 * Tracks browser connectivity.
 *
 * Seeded from `navigator.onLine` rather than a hardcoded `true`: the old
 * initial value meant that loading the app while already offline rendered the
 * full UI, and the offline screen only ever appeared if the connection dropped
 * *during* the session (the one case the event listeners cover).
 */
const useOnlineStatus = () => {
  const [onlineStatus, setOnlineStatus] = useState(getInitialStatus);

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // The status can change between the initial render and this effect running.
    setOnlineStatus(getInitialStatus());

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return onlineStatus;
};

export default useOnlineStatus;
