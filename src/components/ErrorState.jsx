import { useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiWifiOff, FiLock, FiRefreshCw } from "react-icons/fi";
import { ERROR_KIND } from "../utils/firestoreErrors";
import Button from "./Button";

/**
 * Renders a classified failure inline, next to the content that failed.
 *
 * Replaces the previous approach of firing a toast: a toast auto-dismisses after
 * 1.5s, leaving the user staring at a blank region with no explanation and no way
 * to retry. An inline panel persists, names the actual problem, and offers the
 * one action that can help for that specific error kind.
 */
const KIND_ICON = {
  [ERROR_KIND.NETWORK]: FiWifiOff,
  [ERROR_KIND.PERMISSION]: FiLock,
  [ERROR_KIND.UNAUTHENTICATED]: FiLock,
};

const ErrorState = ({ errorInfo, onRetry, isRetrying = false, className = "" }) => {
  const navigate = useNavigate();

  if (!errorInfo) return null;

  const { kind, title, message, action, retryable } = errorInfo;
  const Icon = KIND_ICON[kind] || FiAlertTriangle;

  const needsLogin = kind === ERROR_KIND.UNAUTHENTICATED;
  const showRetry = retryable && typeof onRetry === "function";

  return (
    <div
      // `alert` so assistive tech announces the failure as soon as it appears.
      role="alert"
      className={`rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-8 text-center ${className}`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
        <Icon className="text-red-600 dark:text-red-400" size={26} aria-hidden="true" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-700 dark:text-gray-300">{message}</p>

      {(showRetry || needsLogin) && (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {showRetry && (
            <Button onClick={onRetry} disabled={isRetrying}>
              <FiRefreshCw
                size={16}
                aria-hidden="true"
                className={isRetrying ? "animate-spin" : undefined}
              />
              {isRetrying ? "Retrying…" : action || "Retry"}
            </Button>
          )}

          {needsLogin && (
            <Button onClick={() => navigate("/login")}>Log in again</Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorState;
