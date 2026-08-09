import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useSelector } from 'react-redux';
import {
  FiPackage, FiClock, FiMapPin, FiPhone, FiCopy, FiCheck, FiChevronLeft, FiXCircle,
} from 'react-icons/fi';
import { MdRestaurant, MdDeliveryDining } from 'react-icons/md';
import { IoHome } from 'react-icons/io5';
import Button from '../components/Button';
import CancelOrderModal from '../components/CancelOrderModal';
import { notify } from '../utils/notificationUtils';
import { scheduleStatusUpdates, cancelOrder } from '../utils/orderTrackingService';

// Orders can only be cancelled before the rider picks them up — once it's
// "out_for_delivery" the food is already made and en route, matching Swiggy/Zomato.
const CANCELLABLE_STATUSES = ['received', 'preparing'];

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = [
  {
    key: 'received',       label: 'Order Accepted',
    sublabel: 'Restaurant has accepted your order',
    liveMessage: 'Hang tight, the restaurant has your order!',
    Icon: FiPackage,   color: 'emerald', emoji: '🧾',
  },
  {
    key: 'preparing',      label: 'Being Prepared',
    sublabel: 'Chef is cooking your meal',
    liveMessage: 'Your food is being freshly prepared.',
    Icon: MdRestaurant, color: 'orange',  emoji: '👨‍🍳',
  },
  {
    key: 'out_for_delivery', label: 'Out for Delivery',
    sublabel: 'Rider is heading to you',
    liveMessage: "Your order is on its way, almost there!",
    Icon: MdDeliveryDining, color: 'blue', emoji: '🛵',
  },
  {
    key: 'delivered',      label: 'Delivered',
    sublabel: 'Enjoy your meal! 🎉',
    liveMessage: 'Your order has arrived. Bon appétit!',
    Icon: IoHome,      color: 'green',   emoji: '🎉',
  },
];

// ── Colour map ────────────────────────────────────────────────────────────────
const CC = {
  emerald: { bg:'bg-emerald-500', text:'text-emerald-600 dark:text-emerald-400', ring:'ring-emerald-500/25', light:'bg-emerald-50 dark:bg-emerald-900/20', border:'border-emerald-200 dark:border-emerald-800' },
  orange:  { bg:'bg-orange-500',  text:'text-orange-600 dark:text-orange-400',   ring:'ring-orange-500/25',  light:'bg-orange-50 dark:bg-orange-900/20',   border:'border-orange-200 dark:border-orange-800'  },
  blue:    { bg:'bg-blue-500',    text:'text-blue-600 dark:text-blue-400',        ring:'ring-blue-500/25',    light:'bg-blue-50 dark:bg-blue-900/20',        border:'border-blue-200 dark:border-blue-800'      },
  green:   { bg:'bg-green-500',   text:'text-green-600 dark:text-green-400',      ring:'ring-green-500/25',   light:'bg-green-50 dark:bg-green-900/20',      border:'border-green-200 dark:border-green-800'    },
};
// ── Inject animation keyframes once ──────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('ot-styles')) {
  const s = document.createElement('style');
  s.id = 'ot-styles';
  s.textContent = `
    @keyframes ot-confetti {
      to { transform: translateY(100vh) translateX(var(--tx)) rotate(var(--rot)); opacity: 0; }
    }
    @keyframes ot-bike {
      0%,100% { transform: translateX(0) rotate(0deg); }
      30%      { transform: translateX(5px) rotate(-3deg); }
      70%      { transform: translateX(-3px) rotate(2deg); }
    }
    .ot-bike { animation: ot-bike 0.7s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

// ── Confetti burst on delivery ────────────────────────────────────────────────
const triggerConfetti = () => {
  const colors = ['#FFC72C','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD'];
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 pointer-events-none z-50';
  document.body.appendChild(wrap);
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('div');
    p.className = 'absolute w-2 h-2 rounded-sm';
    p.style.cssText = `background:${colors[i % colors.length]};left:${35+Math.random()*30}%;top:30%;--tx:${(Math.random()-.5)*300}px;--rot:${Math.random()*720}deg;animation:ot-confetti ${1.2+Math.random()*1.2}s ease-out ${Math.random()*.4}s forwards;`;
    wrap.appendChild(p);
  }
  setTimeout(() => wrap.remove(), 3500);
};

// ── Live countdown — re-renders every second ──────────────────────────────────
const LiveCountdown = ({ etaDate, isDelivered }) => {
  const [secs, setSecs] = useState(() => Math.max(0, Math.round((etaDate - Date.now()) / 1000)));
  useEffect(() => {
    if (isDelivered) return;
    const id = setInterval(() => setSecs(Math.max(0, Math.round((etaDate - Date.now()) / 1000))), 1000);
    return () => clearInterval(id);
  }, [etaDate, isDelivered]);

  if (isDelivered) return <span className="font-bold text-green-600 dark:text-green-400">Delivered ✓</span>;
  if (secs <= 0)  return <span className="font-bold text-orange-500 animate-pulse">Any moment now…</span>;
  const m = Math.floor(secs / 60), s = secs % 60;
  return <span className="font-bold tabular-nums">{m > 0 ? `${m} min ${String(s).padStart(2,'0')} sec` : `${s} sec`}</span>;
};
// ── Horizontal progress stepper ───────────────────────────────────────────────
const ProgressSteps = ({ currentIndex }) => (
  <div className="flex items-center">
    {STATUS_CONFIG.map((step, i) => {
      const done = i < currentIndex, active = i === currentIndex;
      return (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ${
              done   ? 'bg-gray-800 dark:bg-yellow-400 text-white dark:text-zinc-900 shadow-md'
            : active ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white ring-2 ring-gray-800 dark:ring-yellow-400 shadow-md'
            :          'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600'}`}>
              {done ? <FiCheck size={14} /> : step.emoji}
            </div>
            <span className={`mt-1 hidden sm:block text-[10px] font-semibold text-center w-14 leading-tight ${done || active ? 'text-gray-800 dark:text-zinc-200' : 'text-gray-400 dark:text-zinc-600'}`}>
              {step.label}
            </span>
          </div>
          {i < STATUS_CONFIG.length - 1 && (
            <div className="relative mx-1 h-0.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700 mb-4 sm:mb-5">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gray-800 dark:bg-yellow-400 transition-all duration-700 ease-out" style={{ width: done ? '100%' : '0%' }} />
            </div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Timeline step ─────────────────────────────────────────────────────────────
const TimelineStep = ({ status, isActive, isCompleted, isLast, timestamp }) => {
  const c = CC[status.color], Icon = status.Icon, dim = !isActive && !isCompleted;
  return (
    <div className="relative flex gap-4">
      <div className="relative flex flex-col items-center">
        <div className={`relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
          isCompleted ? 'bg-gray-800 dark:bg-yellow-400 shadow-md'
          : isActive  ? `${c.bg} shadow-lg ring-4 ${c.ring} animate-pulse`
          :              'bg-gray-100 dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700'}`}>
          {isCompleted
            ? <FiCheck size={18} className="text-white dark:text-zinc-900" />
            : <Icon size={18} className={`${isActive ? 'text-white' : 'text-gray-400 dark:text-zinc-600'}${isActive && status.key === 'out_for_delivery' ? ' ot-bike' : ''}`} />}
        </div>
        {!isLast && (
          <div className="relative mt-1 w-0.5 flex-1 overflow-hidden bg-gray-100 dark:bg-zinc-800" style={{ minHeight: 44 }}>
            {isCompleted && <div className={`absolute inset-x-0 top-0 h-full ${c.bg}`} />}
          </div>
        )}
      </div>
      <div className={`flex-1 ${isLast ? 'pb-2' : 'pb-9'}`}>
        <div className="flex items-start justify-between gap-2 pt-1.5">
          <div>
            <p className={`font-bold leading-tight ${dim ? 'text-gray-400 dark:text-zinc-600' : 'text-gray-900 dark:text-white'}`}>{status.label}</p>
            <p className={`mt-0.5 text-sm ${dim ? 'text-gray-300 dark:text-zinc-700' : 'text-gray-500 dark:text-zinc-400'}`}>{status.sublabel}</p>
          </div>
          {timestamp && !dim && <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c.light} ${c.text} ${c.border}`}>{timestamp}</span>}
        </div>
        {isActive && <p className={`mt-1.5 text-sm font-medium italic ${c.text}`}>{status.liveMessage}</p>}
      </div>
    </div>
  );
};
// ── Main component ────────────────────────────────────────────────────────────
const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.user.user);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const confettiShownRef = useRef(false);
  const scheduleCleanupRef = useRef(null);

  // Live Firestore listener — reads trackingStatus & trackingHistory
  useEffect(() => {
    if (!user || !orderId) return;
    const unsub = onSnapshot(
      doc(db, 'orders', user.uid, 'orders', orderId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setOrder({ id: snap.id, ...data });
          if (data.trackingStatus === 'delivered' && !confettiShownRef.current) {
            confettiShownRef.current = true;
            triggerConfetti();
          }
        }
        setLoading(false);
      },
      (err) => { console.error('[OrderTracking]', err); notify.error('Failed to load order'); setLoading(false); },
    );
    return () => unsub();
  }, [user, orderId]);

  // Restart status timers on every mount — handles navigating away and back.
  // scheduleStatusUpdates calculates remaining time from createdAt so already-fired
  // steps are safely skipped and nothing is double-scheduled.
  useEffect(() => {
    if (!order || !user) return;
    if (scheduleCleanupRef.current) scheduleCleanupRef.current();
    // A cancelled (or delivered) order has no further steps to fire. Scheduling
    // against 'cancelled' would find index -1 and re-queue every status, which
    // would silently un-cancel the order — so bail out.
    if (order.trackingStatus === 'cancelled' || order.trackingStatus === 'delivered') return;
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    // Pass the restaurant's delivery time so status transitions fire at the
    // proportional intervals (preparing ~75% of total, out_for_delivery ~25%).
    scheduleCleanupRef.current = scheduleStatusUpdates(
      user.uid, orderId, createdAt,
      order.trackingStatus ?? 'received',
      order.deliveryTimeMinutes ?? 30,
    );
    return () => { if (scheduleCleanupRef.current) scheduleCleanupRef.current(); };
  }, [order?.trackingStatus, user, orderId]);

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cancel flow: write the cancellation, then immediately stop the status timers
  // so no queued "preparing"/"out_for_delivery" write fires after the order is
  // gone. The onSnapshot listener repaints the page into its cancelled state.
  const handleCancel = async (reason) => {
    if (!user) return;
    setCancelling(true);
    try {
      await cancelOrder(user.uid, orderId, reason);
      scheduleCleanupRef.current?.();
      setCancelOpen(false);
      notify.success('Your order has been cancelled');
    } catch (err) {
      console.error('[OrderTracking] cancel failed:', err);
      notify.error('Could not cancel the order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };
  const getCurrentIdx = () => {
    const idx = STATUS_CONFIG.findIndex((s) => s.key === (order?.trackingStatus));
    return idx >= 0 ? idx : 0;
  };
  const formatTs = (val) => {
    if (!val) return null;
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };
  const money = (v) => `₹${(Number(v) || 0).toFixed(2)}`;
  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 space-y-4" aria-hidden="true">
      <div className="h-44 w-full animate-pulse rounded-2xl bg-gray-200 dark:bg-zinc-800" />
      <div className="h-72 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-zinc-800" />
    </div>
  );

  // ── Order not found ──────────────────────────────────────────────────────────
  if (!order) return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-6 py-12 text-center shadow-sm">
        <p className="text-5xl mb-4">😕</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order not found</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-gray-500 dark:text-zinc-400">
          We couldn't locate this order on your account.
        </p>
        <Button size="lg" className="mt-7" onClick={() => navigate('/profile')}>View order history</Button>
      </div>
    </div>
  );

  // ── Cancelled state ──────────────────────────────────────────────────────────
  // A cancelled order has no timeline to advance — show a dedicated, calm screen
  // with the reason, a refund note for prepaid orders, and clear next steps.
  if (order.trackingStatus === 'cancelled') {
    const cancelledAt = formatTs(order.cancelledAt) || formatTs(order.trackingHistory?.cancelled);
    const wasPrepaid = order.paymentStatus === 'paid';
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <button onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <FiChevronLeft size={18} /> Back to home
          </button>

          <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-zinc-900 p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
              <FiXCircle className="text-red-500" size={34} />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-gray-900 dark:text-white">Order Cancelled</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-zinc-400">
              Your order{order.restaurantName ? ` from ${order.restaurantName}` : ''} was cancelled
              {cancelledAt ? ` at ${cancelledAt}` : ''}.
            </p>

            {order.cancellationReason && (
              <div className="mx-auto mt-5 max-w-sm rounded-xl bg-gray-50 dark:bg-zinc-800 px-4 py-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Reason</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-zinc-300">{order.cancellationReason}</p>
              </div>
            )}

            {wasPrepaid && (
              <p className="mx-auto mt-4 max-w-sm text-xs text-gray-500 dark:text-zinc-400">
                Your payment of <span className="font-semibold">{money(order.total)}</span> will be refunded to
                your original payment method within 5–7 business days.
              </p>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={() => navigate('/')} className="sm:px-8">Order again</Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/profile/orders')} className="sm:px-8">
                View orders
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = getCurrentIdx();
  const currentStatus = STATUS_CONFIG[currentIdx];
  const isDelivered = order.trackingStatus === 'delivered';
  const trackingHistory = order.trackingHistory || {};
  const etaDate = (() => {
    if (!order.estimatedDelivery) return null;
    return order.estimatedDelivery?.toDate ? order.estimatedDelivery.toDate() : new Date(order.estimatedDelivery);
  })();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-24">

      {/* ── Hero status banner ─────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="mx-auto w-full max-w-4xl px-4 pt-5 pb-6">
          <button onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <FiChevronLeft size={18} /> Back
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1">
                {order.restaurantName || 'Your Order'}
              </p>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
                {currentStatus.emoji} {currentStatus.label}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{currentStatus.liveMessage}</p>
            </div>

            {/* ETA / delivered badge */}
            {isDelivered ? (
              <div className="flex-shrink-0 rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-5 py-3 text-center">
                <p className="text-3xl">🎉</p>
                <p className="text-xs font-bold text-green-700 dark:text-green-300 mt-1">Order Delivered!</p>
              </div>
            ) : etaDate ? (
              <div className="flex-shrink-0 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-1">
                  <FiClock size={11} /> Arriving in
                </div>
                <div className="text-lg text-gray-900 dark:text-white">
                  <LiveCountdown etaDate={etaDate} isDelivered={isDelivered} />
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  by {etaDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : null}
          </div>

          {/* Horizontal progress stepper */}
          <ProgressSteps currentIndex={currentIdx} />
        </div>
      </div>
      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Left: Timeline */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Order Timeline</h2>
              {STATUS_CONFIG.map((status, i) => (
                <TimelineStep
                  key={status.key}
                  status={status}
                  isActive={i === currentIdx}
                  isCompleted={i < currentIdx}
                  isLast={i === STATUS_CONFIG.length - 1}
                  timestamp={formatTs(trackingHistory[status.key])}
                />
              ))}
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-4">

            {/* Order ID */}
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Order ID</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-gray-50 dark:bg-zinc-800 px-3 py-2 font-mono text-xs text-gray-800 dark:text-zinc-200">
                  {orderId}
                </code>
                <button onClick={copyOrderId} aria-label={copied ? 'Copied' : 'Copy order ID'}
                  className="flex-shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                  {copied ? <FiCheck size={15} className="text-green-500" /> : <FiCopy size={15} />}
                </button>
              </div>
            </div>

            {/* Delivery details */}
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <h3 className="mb-3 font-bold text-gray-900 dark:text-white">Delivery Details</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex gap-2.5">
                  <FiMapPin className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" size={15} />
                  <span className="text-gray-700 dark:text-zinc-300">{order.deliveryAddress}</span>
                </div>
                {order.phoneNumber && (
                  <div className="flex gap-2.5">
                    <FiPhone className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" size={15} />
                    <span className="text-gray-700 dark:text-zinc-300">{order.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Bill summary */}
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <h3 className="mb-3 font-bold text-gray-900 dark:text-white">Bill Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-700 dark:text-zinc-300">
                  <dt>Items ({order.items?.length || 0})</dt>
                  <dd className="tabular-nums">{money(order.itemSubtotal ?? order.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-zinc-400">
                  <dt>GST (5%)</dt>
                  <dd className="tabular-nums">{money(order.gst)}</dd>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-zinc-400">
                  <dt>Platform fee</dt>
                  <dd className="tabular-nums">{money(order.platformFee)}</dd>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-zinc-400">
                  <dt>Delivery</dt>
                  <dd className="tabular-nums">{money(order.deliveryFee)}</dd>
                </div>
                <div className="flex justify-between border-t border-gray-100 dark:border-zinc-700 pt-2 font-bold text-gray-900 dark:text-white">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{money(order.total)}</dd>
                </div>
              </dl>
            </div>

            <Button variant="secondary" fullWidth onClick={() => navigate('/')}>
              Order more food
            </Button>

            {/* Cancel affordance — available only in the cancellable window.
                Once the rider has the order, it's explained why it's locked. */}
            {!isDelivered && (
              CANCELLABLE_STATUSES.includes(order.trackingStatus) ? (
                <Button variant="dangerSubtle" fullWidth onClick={() => setCancelOpen(true)}>
                  Cancel order
                </Button>
              ) : (
                <p className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/60 px-4 py-3 text-center text-xs text-gray-500 dark:text-zinc-400">
                  🛵 Your rider is on the way, this order can no longer be cancelled.
                </p>
              )
            )}

          </div>{/* end right panel */}
        </div>{/* end grid */}
      </div>{/* end body */}

      <CancelOrderModal
        isOpen={cancelOpen}
        onClose={() => (cancelling ? null : setCancelOpen(false))}
        onConfirm={handleCancel}
        isSubmitting={cancelling}
      />
    </div>
  );
};

export default OrderTracking;

