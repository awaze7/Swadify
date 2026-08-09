import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  collection, doc, getDocs, limit, onSnapshot, orderBy, query,
} from 'firebase/firestore';
import { db } from '../firebase';
import { FiChevronRight, FiX } from 'react-icons/fi';
import { MdRestaurant, MdDeliveryDining } from 'react-icons/md';
import { FiPackage } from 'react-icons/fi';
import { IoHome } from 'react-icons/io5';

// Statuses that mean the order is still in flight and worth surfacing.
const ACTIVE_STATUSES = ['received', 'preparing', 'out_for_delivery'];

// Display copy per status — labels match the OrderTracking timeline exactly.
const STATUS_META = {
  received:         { label: 'Order Accepted',   caption: 'Restaurant has your order',   Icon: FiPackage,        accent: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  preparing:        { label: 'Being Prepared',   caption: 'Your food is being cooked',   Icon: MdRestaurant,     accent: 'text-orange-600 dark:text-orange-400',   dot: 'bg-orange-500'  },
  out_for_delivery: { label: 'Out for Delivery', caption: 'Rider is on the way',         Icon: MdDeliveryDining, accent: 'text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500'    },
  delivered:        { label: 'Delivered',        caption: 'Enjoy your meal! 🎉',         Icon: IoHome,           accent: 'text-green-600 dark:text-green-400',     dot: 'bg-green-500'   },
};

// Slide-up entrance, injected once.
if (typeof document !== 'undefined' && !document.getElementById('aob-styles')) {
  const s = document.createElement('style');
  s.id = 'aob-styles';
  s.textContent = `
    @keyframes aob-slide-up { from { transform: translateY(120%); } to { transform: translateY(0); } }
    .aob-enter { animation: aob-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
  `;
  document.head.appendChild(s);
}

// Compact ETA countdown — ticks each second, no seconds once we're minutes out.
const MiniCountdown = ({ etaDate }) => {
  const [secs, setSecs] = useState(() => Math.max(0, Math.round((etaDate - Date.now()) / 1000)));
  useEffect(() => {
    const id = setInterval(() => setSecs(Math.max(0, Math.round((etaDate - Date.now()) / 1000))), 1000);
    return () => clearInterval(id);
  }, [etaDate]);

  if (secs <= 0) return <span className="font-semibold">Any moment now</span>;
  const m = Math.ceil(secs / 60);
  return <span className="font-semibold tabular-nums">~{m} min</span>;
};

const toDate = (value) => {
  if (!value) return null;
  const d = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(d?.getTime?.()) ? null : d;
};

/**
 * Persistent bottom strip that surfaces the user's in-flight order on every
 * page — the Swiggy/Zomato pattern. It answers the "I navigated away, how do I
 * get back to tracking?" problem with a live, always-there Track shortcut.
 *
 * Discovery is cheap: it prefers the just-placed order in Redux, and otherwise
 * does a single limit(1) read for the newest order on first load (covers a page
 * refresh, where Redux is empty but an order may still be cooking). Once it has
 * an id it holds one realtime onSnapshot subscription — no polling.
 */
const ActiveOrderBanner = () => {
  const user = useSelector((s) => s.user.user);
  const currentOrder = useSelector((s) => s.orders.currentOrder);
  const location = useLocation();
  const navigate = useNavigate();

  const [trackedId, setTrackedId] = useState(null);
  const [order, setOrder] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  // Remember ids the user explicitly dismissed so they don't pop back on nav.
  const dismissedIdsRef = useRef(new Set());

  // The centered banner (max-w-3xl) only reaches into the bottom-right corner —
  // where the CraveAI launcher lives — on narrower viewports. Above ~1116px the
  // banner's right edge clears the launcher entirely, so lifting the button
  // there just makes it float for no reason. Gate the lift on this breakpoint.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 1120px)');
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // 1 ─ Decide which order to track. Redux (fresh placement) wins; otherwise
  // fall back to a one-shot fetch of the most recent order.
  useEffect(() => {
    if (!user) { setTrackedId(null); return; }
    if (currentOrder?.id) { setTrackedId(currentOrder.id); return; }

    let cancelled = false;
    (async () => {
      try {
        const ref = collection(db, 'orders', user.uid, 'orders');
        const snap = await getDocs(query(ref, orderBy('createdAt', 'desc'), limit(1)));
        if (cancelled || snap.empty) return;
        const d = snap.docs[0];
        if (ACTIVE_STATUSES.includes(d.data().trackingStatus)) setTrackedId(d.id);
      } catch {
        // Non-critical UI — a failed lookup just means no banner this session.
      }
    })();
    return () => { cancelled = true; };
  }, [user, currentOrder?.id]);

  // 2 ─ Live subscription to the tracked order.
  useEffect(() => {
    if (!user || !trackedId) { setOrder(null); return; }
    setDismissed(dismissedIdsRef.current.has(trackedId));
    const unsub = onSnapshot(
      doc(db, 'orders', user.uid, 'orders', trackedId),
      (snap) => setOrder(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => {},
    );
    return () => unsub();
  }, [user, trackedId]);

  // 3 ─ Auto-retire the banner a few seconds after delivery, so the celebratory
  // state is seen but doesn't linger forever.
  useEffect(() => {
    if (order?.trackingStatus !== 'delivered') return;
    const t = setTimeout(() => {
      dismissedIdsRef.current.add(order.id);
      setDismissed(true);
    }, 8000);
    return () => clearTimeout(t);
  }, [order?.trackingStatus, order?.id]);

  // ── Visibility gates ────────────────────────────────────────────────────
  // Hide on the tracking page itself and the confirmation page (both already
  // show this info), when there's nothing active, or after dismissal.
  const onOwnPage =
    location.pathname.startsWith('/order-tracking') ||
    location.pathname.startsWith('/order-confirmation');

  const status = order?.trackingStatus;
  const showable = status && status !== 'cancelled' && STATUS_META[status];
  const visible = Boolean(user && order && !dismissed && !onOwnPage && showable);

  // Publish the banner's footprint as a CSS variable while it's on screen *and*
  // the viewport is narrow enough for us to overlap the bottom-right launcher,
  // so it lifts itself above us via calc() instead of both fixed elements
  // fighting for the corner. On wide screens the centered banner never reaches
  // the launcher, so we leave the lift at 0 and the button stays put. Cleared
  // on hide/unmount so the launcher drops back to its normal position.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--aob-launcher-lift', visible && narrow ? '5.5rem' : '0px');
    return () => root.style.setProperty('--aob-launcher-lift', '0px');
  }, [visible, narrow]);

  if (!visible) return null;

  const meta = STATUS_META[status];
  const { Icon } = meta;
  const isDelivered = status === 'delivered';
  const etaDate = toDate(order.estimatedDelivery);

  const dismiss = () => {
    dismissedIdsRef.current.add(order.id);
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-4 sm:pb-4 pointer-events-none">
      <div className="aob-enter pointer-events-auto mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur sm:gap-4 sm:px-5">
        {/* Status icon with a live pulse dot while in flight */}
        <div className="relative flex-shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800">
            <Icon size={22} className={meta.accent} />
          </div>
          {!isDelivered && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${meta.dot} opacity-75`} />
              <span className={`relative inline-flex h-3 w-3 rounded-full ${meta.dot}`} />
            </span>
          )}
        </div>

        {/* Status text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`truncate text-sm font-bold ${meta.accent}`}>{meta.label}</p>
            {!isDelivered && etaDate && (
              <span className="flex-shrink-0 rounded-full bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-gray-600 dark:text-zinc-300">
                <MiniCountdown etaDate={etaDate} />
              </span>
            )}
          </div>
          <p className="truncate text-xs text-gray-500 dark:text-zinc-400">
            {order.restaurantName ? `${order.restaurantName} · ` : ''}{meta.caption}
          </p>
        </div>

        {/* Track CTA */}
        <button
          type="button"
          onClick={() => navigate(`/order-tracking/${order.id}`)}
          className="flex flex-shrink-0 items-center gap-1 rounded-xl bg-gray-900 dark:bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm transition-all hover:bg-black dark:hover:bg-yellow-400 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
        >
          Track <FiChevronRight size={16} aria-hidden="true" />
        </button>

        {/* Dismiss — only offered once delivered, so an active order can't be
            accidentally hidden and lost. */}
        {isDelivered && (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
          >
            <FiX size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ActiveOrderBanner;
