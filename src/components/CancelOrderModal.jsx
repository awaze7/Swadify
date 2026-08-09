import { useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import Button from './Button';

const CANCEL_REASONS = [
  'I want to change my order',
  'Ordered by mistake',
  'Delivery time is too long',
  'Restaurant not responding',
  'Other',
];

/**
 * Confirmation dialog for cancelling an order.
 *
 * Mirrors the industry pattern: a brief interstitial with preset reasons so the
 * platform can learn *why* orders drop off, an explicit (not defaulted) confirm,
 * and a safe way out. The parent owns the async cancel call; this dialog only
 * reports which reason was picked, disables itself while cancelling, and calls
 * onCancel on success so the parent can close it.
 */
const CancelOrderModal = ({ isOpen, onClose, onConfirm, isSubmitting = false }) => {
  const [reason, setReason] = useState('');
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  // Reset the selection every time the dialog opens, and wire up the same
  // Escape-to-close, focus-trap and scroll-lock behaviour as OrderDetailModal.
  useEffect(() => {
    if (!isOpen) return;
    setReason('');

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-800 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-zinc-700 px-5 py-4">
          <h2 id="cancel-order-title" className="text-xl font-bold text-gray-900 dark:text-white">
            Cancel your order?
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close cancel dialog"
            className="flex-shrink-0 rounded-lg p-2 text-gray-500 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:opacity-50"
          >
            <FiX size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Let us know why you're cancelling. This helps us improve.
          </p>

          <div className="mt-4 space-y-2" role="radiogroup" aria-label="Cancellation reason">
            {CANCEL_REASONS.map((r) => {
              const selected = reason === r;
              return (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    selected
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={r}
                    checked={selected}
                    disabled={isSubmitting}
                    onChange={() => setReason(r)}
                    className="h-4 w-4 accent-red-600"
                  />
                  <span className={`text-sm font-medium ${selected ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-zinc-200'}`}>
                    {r}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2.5 border-t border-gray-200 dark:border-zinc-700 px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting} className="sm:flex-none sm:px-6">
            Keep my order
          </Button>
          <Button
            variant="danger"
            disabled={!reason || isSubmitting}
            onClick={() => onConfirm(reason)}
            className="sm:flex-none sm:px-6"
          >
            {isSubmitting ? 'Cancelling…' : 'Yes, cancel order'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
