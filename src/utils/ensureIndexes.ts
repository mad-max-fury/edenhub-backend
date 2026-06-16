import UserModel from "../models/user.model";
import log from "./logger";

/**
 * Heals the legacy `staffId_1` unique index. The old index was a plain unique
 * index on an optional field, so every customer (staffId = null/absent)
 * collided. We now use a partial unique index (staff only). This:
 *   1. unsets any explicitly-null staffId values,
 *   2. drops the stale non-partial index if present,
 *   3. re-syncs indexes to match the schema (partial unique).
 * Safe + idempotent — runs on every boot.
 */
export const ensureUserIndexes = async () => {
  try {
    // Remove explicit nulls so they are excluded from the partial index.
    await UserModel.collection.updateMany(
      { staffId: null },
      { $unset: { staffId: "" } },
    );

    const indexes = await UserModel.collection.indexes();
    const stale = indexes.find(
      (i: any) => i.name === "staffId_1" && !i.partialFilterExpression,
    );
    if (stale) {
      await UserModel.collection.dropIndex("staffId_1");
      log.info("Dropped stale staffId_1 index.");
    }

    await UserModel.syncIndexes();
  } catch (err) {
    log.error(err, "ensureUserIndexes failed (non-fatal)");
  }
};
