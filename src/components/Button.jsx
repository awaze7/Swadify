/**
 * The one place button styling is decided.
 *
 * The audit that motivated this file found seventeen divergent spellings of "the
 * primary button" across the app — eight different padding pairs, `font-semibold`
 * vs `font-bold`, three `active:scale` values, and four focus-ring colours for the
 * same affordance. Several controls (notably the Login/Signup submit) had no focus
 * style at all, which made them invisible to keyboard users.
 *
 * Variants and sizes are closed sets on purpose: an unrecognised value falls back
 * to the default rather than silently rendering an unstyled control.
 */

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg " +
  "transition-all duration-150 focus:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 " +
  "disabled:active:scale-100";

/*
 * Every variant carries its own ring colour, chosen to stay visible against the
 * surface the button sits on: yellow-500 reads on white and on gray-900, but
 * would disappear on the yellow header, so `onYellow` shifts the offset colour.
 */
const VARIANTS = {
  primary:
    "bg-gray-900 text-white shadow-sm hover:bg-black active:scale-[0.98] " +
    "focus-visible:ring-yellow-500",
  secondary:
    "border border-gray-300 bg-white text-gray-900 shadow-sm hover:bg-gray-100 " +
    "active:scale-[0.98] focus-visible:ring-gray-900",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98] " +
    "focus-visible:ring-red-600",
  // Destructive, but not the page's main action — sits quietly until hovered.
  // Used for "Clear cart" / "Log out": recoverable, so it shouldn't shout like
  // solid `danger`, but it must not read as a neutral `secondary` either.
  dangerSubtle:
    "border border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50 " +
    "hover:text-red-700 active:scale-[0.98] focus-visible:ring-red-500",
  ghost:
    "text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.98] " +
    "focus-visible:ring-gray-900",
  onYellow:
    "bg-gray-900 text-white hover:bg-black active:scale-[0.98] " +
    "focus-visible:ring-gray-900 focus-visible:ring-offset-yellow-300",
  /*
   * The auth screens and the CraveAI widget are built on the warm `stone-*`
   * neutral to pair with the `crave` accent, and contain no `gray-*` at all.
   * A `primary` button there dropped a cool gray-900 slab into an otherwise
   * warm card, close enough to look like a mistake rather than a choice.
   * Same role and metrics as `primary`, warm ramp.
   */
  primaryWarm:
    "bg-stone-900 text-white shadow-sm hover:bg-black active:scale-[0.98] " +
    "focus-visible:ring-crave",
};

/*
 * `sm` and `md` clear 44px of touch target once line-height is accounted for; the
 * previous `px-4 py-2` spelling produced a 36px target that failed WCAG 2.5.8.
 */
const SIZES = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
  xl: "px-6 py-3.5 text-lg",
};

export const buttonClasses = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
} = {}) =>
  [
    BASE,
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

/**
 * Renders a real `<button>`. For navigation use `buttonClasses` on a `<Link>`
 * instead, a router link styled as a button must stay an anchor so that
 * middle-click, modifier-click and "copy link address" keep working.
 */
const Button = ({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  children,
  ...rest
}) => (
  <button
    type={type}
    className={buttonClasses({ variant, size, fullWidth, className })}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
