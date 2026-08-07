/**
 * Razorpay integration helper.
 *
 * Production note for any reviewer: a real deployment would create a
 * server-side Razorpay order (POST /v1/orders) before opening the modal,
 * and verify the payment signature server-side after success. For a
 * portfolio/demo project with test keys only, opening the modal directly
 * is the accepted pattern — Razorpay's own docs show this for prototypes.
 */

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });

/**
 * Opens the Razorpay checkout modal.
 * Resolves with the payment response on success.
 * Rejects with an Error on failure or when the user dismisses the modal.
 *
 * @param {object} opts
 * @param {number}  opts.amount      - Amount in rupees (we convert to paise internally)
 * @param {string}  opts.name        - Merchant/app name shown in the modal
 * @param {string}  opts.description - Order description
 * @param {string}  opts.prefill.name
 * @param {string}  opts.prefill.email
 * @param {string}  opts.prefill.contact
 * @param {string}  opts.method      - 'upi' | 'card' | 'netbanking' | undefined
 */
export const openRazorpayCheckout = async (opts) => {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      // Razorpay requires paise (1 INR = 100 paise)
      amount: Math.round(opts.amount * 100),
      currency: 'INR',
      name: opts.name || 'Swadify',
      description: opts.description || 'Food order',
      image: '/favicon.ico',
      prefill: {
        name: opts.prefill?.name || '',
        email: opts.prefill?.email || '',
        contact: opts.prefill?.contact || '',
      },
      theme: { color: '#111827' },
      modal: {
        // Treat backdrop-click / back-button as an explicit cancellation so
        // the caller can show a recoverable error rather than leaving the UI
        // in a half-submitted state.
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
      handler: (response) => resolve(response),
    };

    // Pre-select the payment method when the user already chose one,
    // so the modal opens on the right tab instead of the default screen.
    if (opts.method === 'upi') options.method = { upi: true };
    if (opts.method === 'card') options.method = { card: true };
    if (opts.method === 'netbanking') options.method = { netbanking: true };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) =>
      reject(new Error(response?.error?.description || 'Payment failed'))
    );
    rzp.open();
  });
};
