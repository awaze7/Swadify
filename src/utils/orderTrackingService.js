import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Canonical status progression for an order.
 * The index position defines the ordering — a higher index means further along.
 */
export const STATUS_ORDER = [
  'received',
  'preparing',
  'out_for_delivery',
  'delivered',
];

/**
 * Compute status delays from the restaurant's actual delivery time.
 *
 * Professional food-delivery apps (Swiggy, Zomato, DoorDash) model the
 * total ETA as: kitchen prep time + last-mile ride time. We mirror that:
 *
 *   received        → instant (order acknowledged)
 *   preparing       → +1 min  (kitchen starts immediately)
 *   out_for_delivery→ total − lastMile  (rider picks up)
 *   delivered       → total  (= the time shown on the restaurant card)
 *
 * lastMile = 45% of total, clamped to [8 min, 15 min].
 *
 * Examples:
 *   20-min restaurant → out @11 min, delivered @20 min  (lastMile = 9 min)
 *   25-min restaurant → out @14 min, delivered @25 min  (lastMile = 11 min)
 *   30-min restaurant → out @17 min, delivered @30 min  (lastMile = 13 min)
 *   45-min restaurant → out @30 min, delivered @45 min  (lastMile capped 15 min)
 *
 * @param {number} deliveryMinutes - sla.minDeliveryTime from the restaurant card
 */
export const computeStatusDelays = (deliveryMinutes = 30) => {
  const totalMs    = deliveryMinutes * 60_000;
  const lastMileMs = Math.min(Math.max(totalMs * 0.45, 8 * 60_000), 15 * 60_000);
  return {
    received:         0,
    preparing:        1 * 60_000,
    out_for_delivery: totalMs - lastMileMs,
    delivered:        totalMs,
  };
};

/**
 * Default delays (30-min restaurant) — kept for backward compatibility.
 * Prefer calling `computeStatusDelays(order.deliveryTimeMinutes)` wherever
 * the real delivery time is available.
 */
export const STATUS_DELAYS_MS = computeStatusDelays(30);

/**
 * Write initial tracking fields onto an order document immediately after
 * the order is created.  Called once from Checkout.jsx.
 */
export const initOrderTracking = async (uid, orderId) => {
  const ref = doc(db, 'orders', uid, 'orders', orderId);
  await updateDoc(ref, {
    trackingStatus: 'received',
    trackingHistory: {
      received: serverTimestamp(),
      preparing: null,
      out_for_delivery: null,
      delivered: null,
    },
  });
};

/**
 * Schedule Firestore writes for every remaining status step.
 *
 * Computes how long is left based on `createdAt` so the timers are
 * correct even if the page is opened minutes after the order was placed.
 * Steps whose scheduled time has already passed fire after a 200 ms
 * grace period instead of being silently skipped.
 *
 * @param {string}      uid                   Firebase auth uid
 * @param {string}      orderId               Firestore order document id
 * @param {Date|string} createdAt             When the order was placed
 * @param {string}      currentStatus         The status already persisted in Firestore
 * @param {number}      [deliveryTimeMinutes] Restaurant's sla.deliveryTime (defaults to 30)
 * @returns {Function}  Cleanup — call this on component unmount to cancel timers
 */
export const scheduleStatusUpdates = (uid, orderId, createdAt, currentStatus, deliveryTimeMinutes = 30) => {
  const delays = computeStatusDelays(deliveryTimeMinutes);
  const ref = doc(db, 'orders', uid, 'orders', orderId);
  const base = createdAt instanceof Date
    ? createdAt.getTime()
    : new Date(createdAt).getTime();
  const now = Date.now();
  const currentIdx = STATUS_ORDER.indexOf(currentStatus ?? 'received');

  const timers = [];

  STATUS_ORDER.forEach((key, idx) => {
    if (idx <= currentIdx) return; // already reached — skip

    const fireAt = base + delays[key];
    const remaining = fireAt - now;
    // If the window was due but status not yet written, fire almost immediately.
    const delay = remaining > 0 ? remaining : 200;

    const t = setTimeout(async () => {
      try {
        await updateDoc(ref, {
          trackingStatus: key,
          [`trackingHistory.${key}`]: serverTimestamp(),
        });
      } catch (err) {
        // Non-fatal: the tracking page still works, just without the live update.
        console.error(`[OrderTracking] Failed to advance to "${key}":`, err);
      }
    }, delay);

    timers.push(t);
  });

  return () => timers.forEach(clearTimeout);
};

/**
 * Cancel an order — writes all cancellation fields to Firestore atomically.
 *
 * Only call this before the order reaches "out_for_delivery".  After writing,
 * stop the scheduling timers via the cleanup function returned by
 * scheduleStatusUpdates so no further status advances fire.
 *
 * @param {string} uid     Firebase auth uid
 * @param {string} orderId Firestore order document id
 * @param {string} reason  Human-readable reason selected by the user
 */
export const cancelOrder = async (uid, orderId, reason) => {
  const ref = doc(db, 'orders', uid, 'orders', orderId);
  await updateDoc(ref, {
    status:                      'cancelled',
    trackingStatus:              'cancelled',
    'trackingHistory.cancelled': serverTimestamp(),
    cancelledAt:                 serverTimestamp(),
    cancellationReason:          reason,
  });
};
