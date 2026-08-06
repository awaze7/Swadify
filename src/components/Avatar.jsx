import { useState } from "react";

/**
 * User avatar with a deterministic initials fallback.
 *
 * ProfileHeader used to render an avatar fetched from
 * `api.github.com/users/awaze7`,the developer's own GitHub account. So every
 * signed-in user saw the same stranger's face. It also hit an unauthenticated,
 * rate-limited endpoint (60 req/hr per IP) on every mount with no caching.
 * The avatar now comes from the user's own `photoURL`, falling back to initials.
 */

export const getInitials = (name, email) => {
  const source = (name || "").trim();

  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    // First + last initial for multi-word names, first two letters otherwise.
    const initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`
        : parts[0].slice(0, 2);
    return initials.toUpperCase();
  }

  // Fall back to the email local part before giving up entirely.
  const local = (email || "").split("@")[0];
  return local ? local.slice(0, 2).toUpperCase() : "U";
};

/**
 * Stable colour per user so the fallback avatar doesn't change between renders
 * or pages. Chosen from a fixed palette by hashing the identity string.
 */
const GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-emerald-500 to-emerald-700",
  "from-violet-500 to-violet-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-teal-700",
];

const pickGradient = (seed) => {
  const key = seed || "";
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  }
  return GRADIENTS[hash % GRADIENTS.length];
};

const SIZES = {
  sm: { box: "w-9 h-9", text: "text-xs" },
  md: { box: "w-12 h-12", text: "text-base" },
  lg: { box: "w-20 h-20", text: "text-2xl" },
  xl: { box: "w-28 h-28 sm:w-32 sm:h-32", text: "text-3xl sm:text-4xl" },
};

const Avatar = ({ user, size = "sm", rounded = "rounded-full", className = "" }) => {
  // Reset on URL change so a new photo gets a fresh attempt after a prior 404.
  const [failed, setFailed] = useState(false);
  const photoURL = user?.photoURL;
  const { box, text } = SIZES[size] || SIZES.sm;

  const initials = getInitials(user?.displayName, user?.email);
  const gradient = pickGradient(user?.uid || user?.email || user?.displayName);

  const base = `${box} ${rounded} flex-shrink-0 ${className}`;

  if (photoURL && !failed) {
    return (
      <img
        key={photoURL}
        src={photoURL}
        alt=""
        onError={() => setFailed(true)}
        className={`${base} object-cover ring-1 ring-black/5`}
      />
    );
  }

  return (
    <div
      // Decorative: the accessible name always comes from adjacent text or the
      // aria-label of the control that wraps this.
      aria-hidden="true"
      className={`${base} bg-gradient-to-br ${gradient} ${text} flex select-none items-center justify-center font-bold text-white ring-1 ring-black/5`}
    >
      {initials}
    </div>
  );
};

export default Avatar;
