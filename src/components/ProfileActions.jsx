import { useEffect, useRef, useState } from 'react';
import { FiLogOut, FiAlertCircle, FiX } from 'react-icons/fi';
import Button from './Button';

/**
 * Session controls at the bottom of the profile page.
 *
 * Previous behaviour and why it changed:
 *  - The confirm step was a two-click toggle on a single button with no way
 *    back: once "Confirm Logout" appeared, the only paths out were logging out
 *    or navigating away. There is now an explicit Cancel, Escape dismisses it,
 *    and the prompt resets itself after 8s of inactivity.
 *  - The button's className ternary had two byte-identical branches, so the
 *    "danger" styling it looked like it was toggling never actually changed.
 *  - `isLoggingOut` is now consumed. Profile.jsx has always passed it; the old
 *    signature was `({ onLogout })` so it was silently dropped and the button
 *    gave no feedback while Firebase signed the user out.
 *  - The static "Account Security" panel (encrypted / never shared / history
 *    preserved) was hardcoded copy, not derived from anything in the app. It
 *    has been dropped for the same reason as the fabricated profile stats.
 */

const CONFIRM_TIMEOUT_MS = 8000;

const ProfileActions = ({ onLogout, isLoggingOut = false }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmRef = useRef(null);
  const triggerRef = useRef(null);

  // Auto-dismiss the confirm prompt so a forgotten click doesn't leave a primed
  // destructive action sitting on screen.
  useEffect(() => {
    if (!showConfirm || isLoggingOut) return;
    const timer = setTimeout(() => setShowConfirm(false), CONFIRM_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [showConfirm, isLoggingOut]);

  // Escape backs out of the confirm step and returns focus to the trigger.
  useEffect(() => {
    if (!showConfirm) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowConfirm(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showConfirm]);

  // Move focus onto the confirming action so keyboard users aren't left on a
  // button that has just been replaced.
  useEffect(() => {
    if (showConfirm) confirmRef.current?.focus();
  }, [showConfirm]);

  const cancel = () => {
    setShowConfirm(false);
    triggerRef.current?.focus();
  };

  return (
    <section aria-labelledby="session-heading">
      <h2 id="session-heading" className="text-xl font-bold text-gray-900">
        Session
      </h2>

      <div className="mt-4 rounded-xl border border-red-100 bg-red-50/60 p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <FiAlertCircle size={22} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900">Log out of Swadify</h3>
            <p className="mt-1 text-sm text-gray-600">
              You'll need to sign in again to view your orders and saved address. Items in
              your cart stay on this device.
            </p>

            <div className="mt-4" aria-live="polite">
              {showConfirm ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm font-semibold text-red-800">Log out of your account?</p>
                  <div className="flex gap-2">
                    <Button
                      ref={confirmRef}
                      variant="danger"
                      onClick={onLogout}
                      disabled={isLoggingOut}
                      aria-busy={isLoggingOut}
                    >
                      <FiLogOut size={17} aria-hidden="true" />
                      {isLoggingOut ? 'Logging out…' : 'Yes, log out'}
                    </Button>
                    <Button variant="secondary" onClick={cancel} disabled={isLoggingOut}>
                      <FiX size={17} aria-hidden="true" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  ref={triggerRef}
                  variant="dangerSubtle"
                  onClick={() => setShowConfirm(true)}
                  disabled={isLoggingOut}
                  className="w-full sm:w-auto"
                >
                  <FiLogOut size={17} aria-hidden="true" />
                  Log out
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileActions;
