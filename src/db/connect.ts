import { connect } from "mongoose";
import logger from "../utils/logger";
import { getConfig } from "../config";

async function connectDocumentDB() {
  const dbUri = getConfig("dbUri");
  try {
    await connect(dbUri);
    logger.info("DocumentDB Connected!");
    return;
  } catch (err: any) {
    logger.error("DocumentDB Connection Failed!");
    throw Error(err);
  }
}

export default connectDocumentDB;
