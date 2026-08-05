/**
 * Maps Firestore/Firebase failures onto a small set of UI-meaningful kinds.
 *
 * The point of this module is that "no documents" is NOT an error — a successful
 * query returning zero docs never reaches here. Everything that does reach here
 * is a genuine failure, and the caller needs to tell the user *which* kind so the
 * message is actionable instead of a generic "something went wrong".
 */

export const ERROR_KIND = {
  NETWORK: "network",
  PERMISSION: "permission",
  UNAUTHENTICATED: "unauthenticated",
  CONFIGURATION: "configuration",
  QUOTA: "quota",
  UNKNOWN: "unknown",
};

// Firestore error codes arrive as either "permission-denied" or the older
// "firestore/permission-denied" form depending on which SDK surface threw.
const normalizeCode = (error) => {
  const raw = error?.code;
  if (typeof raw !== "string") return "";
  return raw.includes("/") ? raw.split("/").pop() : raw;
};

const CODE_TO_KIND = {
  // Transient / connectivity — safe and useful to retry.
  unavailable: ERROR_KIND.NETWORK,
  "deadline-exceeded": ERROR_KIND.NETWORK,
  cancelled: ERROR_KIND.NETWORK,
  aborted: ERROR_KIND.NETWORK,
  internal: ERROR_KIND.NETWORK,

  // Security rules rejected the read — retrying cannot help.
  "permission-denied": ERROR_KIND.PERMISSION,
  unauthenticated: ERROR_KIND.UNAUTHENTICATED,

  // Usually a missing composite index; the console link is in error.message.
  "failed-precondition": ERROR_KIND.CONFIGURATION,
  "invalid-argument": ERROR_KIND.CONFIGURATION,

  "resource-exhausted": ERROR_KIND.QUOTA,
};

export const classifyFirestoreError = (error) => {
  if (!error) return ERROR_KIND.UNKNOWN;

  // A browser that is offline outranks whatever code Firestore reported, because
  // the actionable advice ("check your connection") is the same and clearer.
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return ERROR_KIND.NETWORK;
  }

  const mapped = CODE_TO_KIND[normalizeCode(error)];
  if (mapped) return mapped;

  // Firestore surfaces blocked/failed transports as a plain fetch TypeError,
  // e.g. when an ad-blocker or corporate proxy kills firestore.googleapis.com.
  const message = String(error.message || "").toLowerCase();
  if (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("offline") ||
    message.includes("err_blocked")
  ) {
    return ERROR_KIND.NETWORK;
  }

  return ERROR_KIND.UNKNOWN;
};

/**
 * Kinds worth retrying *automatically*, with backoff, before the user ever sees
 * a failure. Deliberately narrow: auto-retrying a permission denial just burns
 * quota, and auto-retrying an unknown failure can hammer a struggling backend.
 */
export const isRetryableKind = (kind) =>
  kind === ERROR_KIND.NETWORK || kind === ERROR_KIND.QUOTA;

/**
 * Kinds where offering the user a *manual* "Retry" button makes sense. Wider
 * than the automatic set: a person deciding to click again is one deliberate
 * request, and for an unknown or configuration failure it is genuinely the only
 * thing they can do. Only the two kinds that can never succeed on retry —
 * permission and unauthenticated — are excluded.
 */
export const isManuallyRetryableKind = (kind) =>
  kind !== ERROR_KIND.PERMISSION && kind !== ERROR_KIND.UNAUTHENTICATED;

/**
 * Human-facing copy per kind. `context` names the thing that failed to load so
 * one table can serve order history, restaurant data, etc.
 */
export const describeFirestoreError = (error, context = "this content") => {
  const kind = classifyFirestoreError(error);

  const copy = {
    [ERROR_KIND.NETWORK]: {
      title: "Connection problem",
      message: `We couldn't reach our servers to load ${context}. Check your internet connection and try again.`,
      action: "Retry",
    },
    [ERROR_KIND.PERMISSION]: {
      title: "Access denied",
      message: `You don't have permission to view ${context}. If this looks wrong, please contact support.`,
      action: null,
    },
    [ERROR_KIND.UNAUTHENTICATED]: {
      title: "Session expired",
      message: "Your session has expired. Please log in again to continue.",
      action: "Log in",
    },
    [ERROR_KIND.CONFIGURATION]: {
      title: "Something needs attention",
      message: `We hit a problem loading ${context}. Our team has been notified — please try again shortly.`,
      action: "Retry",
    },
    [ERROR_KIND.QUOTA]: {
      title: "Too many requests",
      message: "We're handling more traffic than usual. Please wait a moment and try again.",
      action: "Retry",
    },
    [ERROR_KIND.UNKNOWN]: {
      title: "Unexpected error",
      message: `Something went wrong while loading ${context}. Please try again.`,
      action: "Retry",
    },
  };

  return {
    kind,
    // `retryable` drives the visible Retry button, so it uses the manual set.
    // Automatic backoff retries are a separate decision made by the query layer
    // via isRetryableKind — previously both read the same narrow predicate, so
    // an "Unexpected error" told the user to try again while hiding the only
    // control that would have let them.
    retryable: isManuallyRetryableKind(kind),
    autoRetryable: isRetryableKind(kind),
    ...copy[kind],
  };
};
