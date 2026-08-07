import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiUser, FiLogOut, FiChevronDown, FiMail, FiShoppingBag } from 'react-icons/fi';
import { animate } from 'animejs';
import Avatar from './Avatar';
import useLogout from '../utils/useLogout';
import useReducedMotion from '../utils/useReducedMotion';

/**
 * Account menu in the header.
 *
 * The previous version called anime.js with v3 syntax —
 * `animate({ targets: el, ... })` — but the installed animejs is v4, whose
 * signature is `animate(targets, params)`. That threw
 * "TypeError: Cannot read properties of undefined (reading 'keyframes')"
 * on every single open, so the dropdown never animated and the console filled up.
 * It also used `easing: 'easeOutCubic'`; v4 renamed the option to `ease` and
 * dropped the `ease` prefix from the names.
 */
const UserDropdown = () => {
  const user = useSelector((store) => store.user.user);
  const { logout, isLoggingOut } = useLogout();
  const reducedMotion = useReducedMotion();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  // Remembers whether the menu was opened by keyboard, so we only steal focus
  // into the menu in that case (a mouse user should keep their cursor context).
  const openedViaKeyboard = useRef(false);

  const close = useCallback((options = {}) => {
    setIsOpen(false);
    if (options.restoreFocus) triggerRef.current?.focus();
  }, []);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close({ restoreFocus: true });
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  // Any navigation dismisses the menu.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  /*
   * Entrance animation. useLayoutEffect (not useEffect) so the starting opacity
   * is applied before the browser paints — with a passive effect the menu
   * rendered at full opacity for one frame and then snapped to 0 to animate,
   * producing a visible flash.
   */
  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const element = menuRef.current;

    if (reducedMotion) {
      element.style.opacity = '1';
      element.style.transform = 'none';
      return;
    }

    element.style.opacity = '0';
    const animation = animate(element, {
      opacity: [0, 1],
      translateY: [-8, 0],
      scale: [0.97, 1],
      duration: 180,
      ease: 'outCubic',
    });

    return () => animation?.pause?.();
  }, [isOpen, reducedMotion]);

  // Move focus into the menu when opened from the keyboard.
  useEffect(() => {
    if (isOpen && openedViaKeyboard.current) {
      itemRefs.current[0]?.focus();
      openedViaKeyboard.current = false;
    }
  }, [isOpen]);

  const focusItem = (index) => {
    const items = itemRefs.current.filter(Boolean);
    if (items.length === 0) return;
    // Wrap around at both ends.
    const next = (index + items.length) % items.length;
    items[next]?.focus();
  };

  const currentItemIndex = () =>
    itemRefs.current.filter(Boolean).indexOf(document.activeElement);

  // Roving focus within the menu, per the ARIA menu pattern.
  const handleMenuKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusItem(currentItemIndex() + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusItem(currentItemIndex() - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        focusItem(itemRefs.current.filter(Boolean).length - 1);
        break;
      case 'Tab':
        // Tabbing away should dismiss rather than leave an orphaned open menu.
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      if (!isOpen) {
        event.preventDefault();
        openedViaKeyboard.current = true;
        setIsOpen(true);
      }
    }
  };

  if (!user) return null;

  const displayName = user.displayName || 'Your account';
  const firstName = user.displayName?.split(' ')[0] || 'Account';

  const itemClasses =
    'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 transition-colors duration-100 focus:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700';

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
        className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors duration-150 hover:bg-yellow-400/70 dark:hover:bg-yellow-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-300 dark:focus-visible:ring-offset-gray-900"
        aria-label={`Account menu for ${displayName}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Avatar user={user} size="sm" />
        <span className="hidden max-w-[100px] truncate text-sm font-semibold text-gray-900 dark:text-gray-100 sm:inline">
          {firstName}
        </span>
        <FiChevronDown
          size={16}
          aria-hidden="true"
          className={`text-gray-700 dark:text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/60"
        >
          {/* Identity block */}
          <div className="flex items-start gap-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 px-4 py-3.5">
            <Avatar user={user} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{displayName}</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <FiMail size={12} className="flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="py-1.5">
            <Link
              ref={(el) => { itemRefs.current[0] = el; }}
              to="/profile"
              role="menuitem"
              onClick={() => close()}
              className={`${itemClasses} hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100`}
            >
              <FiUser size={17} className="flex-shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
              <span className="font-medium">My Profile</span>
            </Link>

            <Link
              ref={(el) => { itemRefs.current[1] = el; }}
              to="/profile/orders"
              role="menuitem"
              onClick={() => close()}
              className={`${itemClasses} hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100`}
            >
              <FiShoppingBag size={17} className="flex-shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
              <span className="font-medium">My Orders</span>
            </Link>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 py-1.5">
            <button
              ref={(el) => { itemRefs.current[2] = el; }}
              type="button"
              role="menuitem"
              onClick={logout}
              disabled={isLoggingOut}
              className={`${itemClasses} hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <FiLogOut size={17} className="flex-shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
              <span className="font-medium">{isLoggingOut ? 'Logging out…' : 'Logout'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
