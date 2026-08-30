import { useEffect, useRef } from "react";
import { FiShoppingBag } from "react-icons/fi";
import Button from "./Button";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * The "your cart belongs to one restaurant" guard, shown when a user with a
 * non-empty cart tries to add a dish from a different restaurant. This is the
 * Swiggy/Zomato pattern: a cart holds a single restaurant's order, so switching
 * restaurants is an explicit, confirmed reset rather than a silent mix.
 *
 * Presentational only. The decision (detecting the clash, clearing the cart on
 * confirm) lives in `useCartConflict`; this component just renders the choice.
 *
 * @param {object|null} conflict  `{ currentName, nextName }` while open, `null` when closed
 * @param {Function}    onCancel  keep the current cart, dismiss
 * @param {Function}    onReplace clear the cart and add the pending item(s)
 */
const CartConflictModal = ({ conflict, onCancel, onReplace }) => {
  const dialogRef = useRef(null);

  const isOpen = Boolean(conflict);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCancel();
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
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
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    // Land focus on the first control (the non-destructive "Keep current cart"),
    // so a stray Enter keeps the existing cart rather than wiping it.
    dialogRef.current?.querySelector(FOCUSABLE_SELECTOR)?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const { currentName, nextName } = conflict;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cart-conflict-title"
        aria-describedby="cart-conflict-body"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-800 p-6 shadow-xl sm:p-7"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-500/15">
          <FiShoppingBag size={22} className="text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
        </div>

        <h2 id="cart-conflict-title" className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          Switch restaurants?
        </h2>

        <p id="cart-conflict-body" className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">
          Your cart already has items from{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {currentName || "another restaurant"}
          </span>
          . You can only order from one restaurant at a time. Starting a new cart will clear the current items and let you continue with{" "}
          <span className="font-semibold text-gray-900 dark:text-white">{nextName || "this restaurant"}</span>.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Keep current cart
          </Button>
          <Button variant="danger" onClick={onReplace}>
            Clear cart &amp; continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartConflictModal;
