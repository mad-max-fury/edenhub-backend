/**
 * One-time / manual fix for the legacy `staffId_1` unique index collision.
 * The same logic now also runs automatically on server boot
 * (see utils/ensureIndexes.ts), so usually you just restart the server.
 *
 * Run manually if needed:  npx ts-node src/scripts/fixIndexes.ts
 */
import connectDocumentDB from "../db/connect";
import { ensureUserIndexes } from "../utils/ensureIndexes";
import log from "../utils/logger";

const run = async () => {
  await connectDocumentDB();
  await ensureUserIndexes();
  log.info("User indexes reconciled (staffId is now partial-unique).");
  process.exit(0);
};

run().catch((err) => {
  log.error(err, "Index fix failed");
  process.exit(1);
});
