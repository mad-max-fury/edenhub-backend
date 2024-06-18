require("dotenv").config();

import express from "express";
import config from "config";
import connectDocumentDB from "./db/connect";
import log from "./utils/logger";
import router from "./routes";
import appErrorHandler from "./errors/appErrorHandler";
const app = express();
app.use(express.json());
// app routes
app.use(router);
// Global Error Handling Middleware
app.use(appErrorHandler);
const PORT = config.get("port");

app.listen(PORT, () => {
  log.info(`Server is running on port http://localhost:${PORT}`);
  connectDocumentDB();
});
