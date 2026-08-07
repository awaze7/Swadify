import { Link } from "react-router-dom";
import Button, { buttonClasses } from "./Button";

/**
 * Generic "there is nothing here yet, and that's fine" panel.
 *
 * Deliberately visually distinct from ErrorState: soft neutral surface, no red,
 * no alert semantics. Empty is a normal destination in the app, so it should
 * never borrow the visual language of a failure.
 */
const EmptyState = ({
  illustration,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  secondary,
  className = "",
}) => {
  const hasAction = actionLabel && (actionTo || onAction);

  return (
    <div
      className={`rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50 dark:from-gray-800 to-white dark:to-gray-800 px-6 py-12 text-center ${className}`}
    >
      {illustration && (
        // Purely decorative — the heading below carries the meaning.
        <div className="mx-auto mb-6 flex justify-center" aria-hidden="true">
          {illustration}
        </div>
      )}

      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-xl">{title}</h3>

      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}

      {hasAction &&
        (actionTo ? (
          // Stays an anchor so middle-click and "copy link address" keep working.
          <Link to={actionTo} className={buttonClasses({ size: "lg", className: "mt-7" })}>
            {actionLabel}
          </Link>
        ) : (
          <Button size="lg" onClick={onAction} className="mt-7">
            {actionLabel}
          </Button>
        ))}

      {secondary && <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">{secondary}</div>}
    </div>
  );
};

export default EmptyState;
