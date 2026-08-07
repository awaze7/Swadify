import { useRef, useLayoutEffect, useState } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../utils/ThemeContext';

const TRAVEL = 22;

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const thumbRef = useRef(null);
  // Suppress transition on first paint so thumb snaps into place
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const thumb = thumbRef.current;
    if (!thumb) return;
    // Snap to position before first paint, then enable transition
    thumb.style.transform = `translateX(${isDark ? TRAVEL : 0}px)`;
    requestAnimationFrame(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (!ready) return;
    const thumb = thumbRef.current;
    if (!thumb) return;
    thumb.style.transform = `translateX(${isDark ? TRAVEL : 0}px)`;
  }, [isDark, ready]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={[
        'group relative rounded-full focus:outline-none',
        'focus-visible:ring-2 focus-visible:ring-yellow-500 dark:focus-visible:ring-yellow-400',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-300 dark:focus-visible:ring-offset-gray-900',
        className,
      ].join(' ')}
    >
      {/* Track */}
      <span
        className={[
          'flex h-7 w-[50px] items-center rounded-full p-[3px]',
          'transition-colors duration-300 ease-in-out shadow-inner',
          isDark
            ? 'bg-gray-700/90 ring-1 ring-inset ring-gray-600'
            : 'bg-yellow-400 ring-1 ring-inset ring-yellow-500/40',
        ].join(' ')}
        aria-hidden="true"
      >
        {/* Thumb — spring-like motion via CSS cubic-bezier, no animejs */}
        <span
          ref={thumbRef}
          style={{
            transition: ready
              ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 300ms, color 300ms'
              : 'none',
          }}
          className={[
            'flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full shadow-md',
            isDark ? 'bg-gray-900 text-yellow-300' : 'bg-white text-amber-600',
          ].join(' ')}
        >
          {isDark
            ? <FiMoon size={12} strokeWidth={2.5} aria-hidden="true" />
            : <FiSun  size={12} strokeWidth={2.5} aria-hidden="true" />
          }
        </span>
      </span>
    </button>
  );
};

export default ThemeToggle;
