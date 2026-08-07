import { useCallback, useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { MAX_ITEM_QUANTITY } from "../utils/Redux/cartSlice";
import useReducedMotion from "../utils/useReducedMotion";

/**
 * "ADD" ⇄ "− n +" control for a single menu item.
 *
 * Design notes:
 * - Both states render inside the same fixed-size box, so swapping between them
 *   never nudges the surrounding layout. The previous implementation used
 *   `absolute` positioning with `mt-16` for ADD and `mt-14` for the stepper,
 *   which shifted the control 8px vertically on the first tap.
 * - Every mutation is a synchronous Redux dispatch, so the new quantity is on
 *   screen in the same commit as the click. There is deliberately no pending or
 *   loading state anywhere in this component — a local cart edit has nothing to
 *   wait for, so any spinner would be inventing latency that doesn't exist.
 * - Animations are entrance-only and never gate interaction: the control is
 *   fully clickable while it animates, and mid-flight animations are cancelled
 *   and restarted rather than queued.
 */
const QuantityStepper = ({
  count,
  onAdd,
  onIncrement,
  onDecrement,
  itemName,
  size = "default",
}) => {
  const reducedMotion = useReducedMotion();
  const wrapperRef = useRef(null);
  const countRef = useRef(null);
  const activeAnimation = useRef(null);

  const inCart = count > 0;
  const atMax = count >= MAX_ITEM_QUANTITY;

  // Tracks the previous count so we can tell a genuine state change (0 ⇄ n)
  // apart from the initial mount and from unrelated parent re-renders.
  const previousCount = useRef(count);
  // Skips the entrance animation on first paint — otherwise every item in a
  // freshly expanded menu category would fade in one by one.
  const hasMounted = useRef(false);

  const compact = size === "compact";

  // Screen-reader announcement text. Starts empty so that mounting a menu
  // category full of not-yet-added items announces nothing at all; it only gains
  // content once the user actually changes a quantity.
  const [announcement, setAnnouncement] = useState("");

  const runAnimation = useCallback(
    (target, params) => {
      if (!target || reducedMotion) return;
      // Cancel rather than stack: rapid taps must not queue up animations that
      // would keep the control visually settling after the user has stopped.
      activeAnimation.current?.pause?.();
      activeAnimation.current = animate(target, params);
    },
    [reducedMotion]
  );

  /**
   * Both animations live in one effect because they share the same "what was the
   * previous count" reading. Splitting them meant the first effect advanced the
   * ref before the second could compare against it.
   */
  useEffect(() => {
    const previous = previousCount.current;
    previousCount.current = count;

    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (previous === count) return;

    setAnnouncement(
      count > 0 ? `${count} ${itemName} in cart` : `${itemName} removed from cart`
    );

    const crossedBoundary = (previous === 0) !== (count === 0);

    if (crossedBoundary) {
      // Whole control is swapping between ADD and the stepper.
      runAnimation(wrapperRef.current, {
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: 180,
        ease: "outQuad",
      });
      return;
    }

    // Same control, new number: pop just the digit so a +1 still registers.
    // Routed through runAnimation so it is tracked in `activeAnimation` and gets
    // paused on unmount like the boundary animation does.
    if (count > 0) {
      runAnimation(countRef.current, {
        scale: [1.25, 1],
        duration: 160,
        ease: "outQuad",
      });
    }
  }, [count, itemName, runAnimation]);

  // Stop any in-flight animation if the row unmounts (e.g. the user collapses
  // the menu category) so anime.js isn't left ticking against a detached node.
  useEffect(() => () => activeAnimation.current?.pause?.(), []);

  // Arrow keys adjust quantity while focus is anywhere inside the stepper,
  // matching the ARIA spinbutton convention.
  const handleKeyDown = (event) => {
    if (!inCart) return;

    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault();
      if (!atMax) onIncrement();
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      onDecrement();
    }
  };

  // h-11 is 44px — the WCAG 2.5.8 minimum. These were h-9/h-10 (36px/40px),
  // which made the add-to-cart control, the single most-tapped target in the
  // app, undersized on touch. Widths grew in step to keep the pill proportion.
  const boxClasses = compact ? "h-11 w-[124px]" : "h-11 w-[136px]";
  const labelSize = compact ? "text-sm" : "text-base";

  return (
    <div className={`relative ${boxClasses}`}>
      {/*
        Politely announces the resulting quantity to screen readers. Kept outside
        the animated wrapper so re-mounting the visual control never re-triggers
        or truncates the announcement.
      */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>

      {inCart ? (
        <div
          ref={wrapperRef}
          onKeyDown={handleKeyDown}
          role="group"
          aria-label={`Quantity for ${itemName}`}
          className={`${boxClasses} flex items-stretch justify-between overflow-hidden rounded-lg bg-gray-900 text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 focus-within:ring-2 focus-within:ring-yellow-500 focus-within:ring-offset-1`}
        >
          <button
            type="button"
            onClick={onDecrement}
            // The last decrement removes the item, so surface that intent
            // explicitly instead of a generic "decrease".
            aria-label={
              count === 1 ? `Remove ${itemName} from cart` : `Decrease quantity of ${itemName}`
            }
            className="flex w-11 items-center justify-center rounded-l-lg text-white/90 transition-colors duration-100 hover:bg-white/15 active:bg-white/25 focus:outline-none focus-visible:bg-white/25 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-500"
          >
            {count === 1 ? <FiTrash2 size={compact ? 14 : 15} /> : <FiMinus size={compact ? 15 : 16} />}
          </button>

          <span
            ref={countRef}
            // A spinbutton role gives assistive tech the value + bounds without
            // us having to fake a text input.
            role="spinbutton"
            tabIndex={0}
            aria-valuenow={count}
            aria-valuemin={1}
            aria-valuemax={MAX_ITEM_QUANTITY}
            aria-label={`Quantity of ${itemName}`}
            className={`flex flex-1 items-center justify-center font-semibold tabular-nums ${labelSize} focus:outline-none focus-visible:underline`}
          >
            {count}
          </span>

          <button
            type="button"
            onClick={onIncrement}
            disabled={atMax}
            aria-label={
              atMax
                ? `Maximum quantity of ${MAX_ITEM_QUANTITY} reached for ${itemName}`
                : `Increase quantity of ${itemName}`
            }
            title={atMax ? `Limit of ${MAX_ITEM_QUANTITY} per item` : undefined}
            className="flex w-11 items-center justify-center rounded-r-lg text-white/90 transition-colors duration-100 hover:bg-white/15 active:bg-white/25 focus:outline-none focus-visible:bg-white/25 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:text-white/35 disabled:hover:bg-transparent"
          >
            <FiPlus size={compact ? 15 : 16} />
          </button>
        </div>
      ) : (
        <button
          ref={wrapperRef}
          type="button"
          onClick={onAdd}
          aria-label={`Add ${itemName} to cart`}
          className={`${boxClasses} flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-gray-300 dark:ring-gray-600 transition-all duration-150 hover:bg-gray-900 hover:text-white dark:hover:bg-yellow-500 dark:hover:text-gray-900 dark:hover:ring-yellow-500 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-1 ${labelSize}`}
        >
          Add
        </button>
      )}
    </div>
  );
};

export default QuantityStepper;
