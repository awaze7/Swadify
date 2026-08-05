import { toast } from 'react-toastify';

const defaultStyle = {
  backgroundColor: "#1f2937",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "12px 16px",
  fontWeight: "500",
};

const defaultOptions = {
  position: "top-center",
  autoClose: 1500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

/*
 * Failures need longer on screen than confirmations. 1.5s is fine for "Added to
 * cart" — the user already knows what they did — but it is not enough time to
 * read a sentence explaining what went wrong and what to do about it, which is
 * how errors ended up feeling like unexplained flickers.
 */
const ERROR_AUTOCLOSE = 6000;
const WARNING_AUTOCLOSE = 4000;

export const notify = {
  success: (message, options = {}) =>
    toast.success(message, {
      ...defaultOptions,
      style: { ...defaultStyle, backgroundColor: "#10b981" },
      ...options,
    }),

  error: (message, options = {}) =>
    toast.error(message, {
      ...defaultOptions,
      autoClose: ERROR_AUTOCLOSE,
      style: { ...defaultStyle, backgroundColor: "#ef4444" },
      ...options,
    }),

  info: (message, options = {}) =>
    toast.info(message, {
      ...defaultOptions,
      style: { ...defaultStyle, backgroundColor: "#3b82f6" },
      ...options,
    }),

  warning: (message, options = {}) =>
    toast.warning(message, {
      ...defaultOptions,
      autoClose: WARNING_AUTOCLOSE,
      style: { ...defaultStyle, backgroundColor: "#f59e0b" },
      ...options,
    }),

  loading: (message, options = {}) =>
    toast.loading(message, {
      ...defaultOptions,
      style: defaultStyle,
      autoClose: false,
      ...options,
    }),

  promise: (promise, { pending, success, error }, options = {}) =>
    toast.promise(
      promise,
      {
        pending: { render: pending, ...defaultOptions },
        success: { render: success, ...defaultOptions, style: { ...defaultStyle, backgroundColor: "#10b981" } },
        error: { render: error, ...defaultOptions, style: { ...defaultStyle, backgroundColor: "#ef4444" } },
      },
      { ...defaultOptions, ...options }
    ),
};

export const updateNotification = (toastId, update) => {
  toast.update(toastId, {
    ...defaultOptions,
    ...update,
  });
};
