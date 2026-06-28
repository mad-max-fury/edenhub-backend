import log from "./logger";
import { sweepAbandonedOrders, pollShippedOrderTracking } from "../services/order.service";
import { purgeExpiredDeletions } from "../services/user.service";
import { publishScheduledProducts } from "../services/product.service";

// How often the abandoned-order sweep runs (ms). Independent of the
// abandonment window itself, which is enforced inside the sweep.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes

const safeRun = async (name: string, fn: () => Promise<unknown>) => {
  try {
    await fn();
  } catch (err) {
    log.error(`Scheduled job "${name}" failed: ${err}`);
  }
};

// Starts background jobs. Uses setInterval rather than an external cron
// dependency to keep the deploy footprint small. Each tick is wrapped so a
// failure in one run never crashes the process or stops future runs.
export const startScheduledJobs = () => {
  // Run once shortly after boot so stale orders from downtime are cleared,
  // then on the recurring interval.
  setTimeout(
    () => safeRun("sweepAbandonedOrders", sweepAbandonedOrders),
    60 * 1000,
  );

  setInterval(
    () => safeRun("sweepAbandonedOrders", sweepAbandonedOrders),
    SWEEP_INTERVAL_MS,
  );

  // Account deletion purge — daily
  const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000;
  setTimeout(() => safeRun("purgeExpiredDeletions", purgeExpiredDeletions), 5 * 60 * 1000);
  setInterval(() => safeRun("purgeExpiredDeletions", purgeExpiredDeletions), PURGE_INTERVAL_MS);

  // Tracking poll — every 30 minutes
  const TRACKING_INTERVAL_MS = 30 * 60 * 1000;
  setTimeout(() => safeRun("pollShippedOrderTracking", pollShippedOrderTracking), 3 * 60 * 1000);
  setInterval(() => safeRun("pollShippedOrderTracking", pollShippedOrderTracking), TRACKING_INTERVAL_MS);

  // Scheduled product publish — every 5 minutes
  setInterval(() => safeRun("publishScheduledProducts", publishScheduledProducts), 5 * 60 * 1000);

  log.info("⏱️  Scheduled jobs started (abandoned-order sweep, account purge, tracking poll, scheduled publish)");
};
