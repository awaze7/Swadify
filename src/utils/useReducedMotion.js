import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const getInitial = () =>
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(QUERY).matches
    : false;

/**
 * Tracks the user's `prefers-reduced-motion` setting and keeps updating if they
 * change it mid-session. Every anime.js call in the app is gated on this so
 * motion-sensitive users get instant state changes instead of transitions.
 */
const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(getInitial);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia(QUERY);
    const onChange = (event) => setReducedMotion(event.matches);

    // Safari < 14 only supports the deprecated addListener signature.
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  return reducedMotion;
};

export default useReducedMotion;
