import { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import Button from "./Button";

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance (Default)" },
  { id: "deliveryTime", label: "Delivery Time" },
  { id: "rating", label: "Rating" },
  { id: "costLowToHigh", label: "Cost: Low to High" },
  { id: "costHighToLow", label: "Cost: High to Low" },
];

/**
 * Sort control for the restaurant list.
 *
 * The options were previously `<label onClick>` elements with no input, no
 * `role`, and no `tabIndex`, so the entire sort feature was unreachable by
 * keyboard and invisible to screen readers. They are now genuine radio inputs
 * in a labelled group: arrow keys move between them for free, and the visual
 * design is unchanged (the native control is hidden with `sr-only` and the
 * styled circle is driven by `peer-checked`).
 */
const SortDropdown = ({ selectedSort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState(selectedSort);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    setTempSelected(selectedSort);
  }, [selectedSort]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Escape closes the popover — previously it could only be dismissed with
    // the mouse, which left keyboard users stuck inside it.
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleApply = () => {
    onSortChange(tempSelected);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const selectedOptionLabel =
    SORT_OPTIONS.find((opt) => opt.id === selectedSort)?.label || "Sort By";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 ${
          selectedSort !== "relevance"
            ? "border-gray-900 bg-gray-900 text-white dark:border-yellow-500 dark:bg-yellow-500 dark:text-gray-900"
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
      >
        <span>{selectedSort === "relevance" ? "Sort By" : selectedOptionLabel}</span>
        <FiChevronDown
          aria-hidden="true"
          className={`text-base transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        // The trigger advertises aria-haspopup="dialog", so the popover needs a
        // matching role — without it a screen reader announced a dialog that,
        // as far as the tree was concerned, never opened.
        // origin-top makes the scale in the fadeIn keyframe grow downward out of
        // the trigger instead of from the popover's centre. motion-reduce drops
        // the animation for anyone who asked for less motion.
        <div
          role="dialog"
          aria-label="Sort restaurants by"
          className="absolute left-0 z-50 mt-2 w-64 origin-top animate-fadeIn rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-2xl dark:shadow-gray-950/60 motion-reduce:animate-none"
        >
          <fieldset>
            <legend className="sr-only">Sort restaurants by</legend>
            <div className="space-y-1">
              {SORT_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg py-2"
                >
                  <input
                    type="radio"
                    name="sort-option"
                    value={option.id}
                    checked={tempSelected === option.id}
                    onChange={() => setTempSelected(option.id)}
                    className="peer sr-only"
                  />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors group-hover:text-gray-900 dark:group-hover:text-gray-100 peer-checked:font-bold peer-checked:text-gray-900 dark:peer-checked:text-gray-100">
                    {option.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 transition-all group-hover:border-gray-400 dark:group-hover:border-gray-400 peer-checked:border-gray-900 dark:peer-checked:border-yellow-400 peer-checked:bg-gray-900 dark:peer-checked:bg-yellow-400 peer-checked:[&>span]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-yellow-500 peer-focus-visible:ring-offset-2"
                  >
                    <span className="h-2 w-2 rounded-full bg-white opacity-0 transition-opacity" />
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Button fullWidth onClick={handleApply} className="mt-6">
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;
