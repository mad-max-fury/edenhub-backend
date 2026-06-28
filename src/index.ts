require("dotenv").config();
import express from "express";
import { createServer } from "http";
import connectDocumentDB from "./db/connect";
import log from "./utils/logger";
import router from "./routes";
import appErrorHandler from "./errors/appErrorHandler";
import AppError from "./errors/appError";
import { getConfig } from "./config";
import { bootstrapPermissions } from "./utils/bootstrap.utils";
import { ensureUserIndexes } from "./utils/ensureIndexes";
import { startScheduledJobs } from "./utils/scheduler.utils";
import auditLogger from "./middlewares/auditLogger";
import { paystackWebhookHandler, stripeWebhookHandler } from "./controllers/order.controller";
import { initSocket } from "./socket";
import cors from "cors";
const session = require("express-session");
const passport = require("passport");
require("./lib/passport");

const startServer = async () => {
  const app = express();

  const rawOrigins = getConfig("allowedOrigins") || [];
  const allowedOrigins = rawOrigins.map((url) => url.replace(/\/$/, "").trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          log.warn(`CORS Blocked for origin: ${origin}`);
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      credentials: true,
      optionsSuccessStatus: 200,
    }),
  );

  // Paystack webhook needs the raw body for signature verification, so it is
  // mounted before the JSON body parser.
  app.post(
    "/api/order/webhook/paystack",
    express.raw({ type: "*/*" }),
    paystackWebhookHandler,
  );

  app.post(
    "/api/order/webhook/stripe",
    express.raw({ type: "*/*" }),
    stripeWebhookHandler,
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(
    session({
      secret: getConfig("sessionSecret"),
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 2,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  await connectDocumentDB();
  await ensureUserIndexes();

  app.use(auditLogger);
  app.use(router);

  try {
    await bootstrapPermissions(app);
  } catch (error) {
    process.exit(1);
  }

  app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

  app.use(appErrorHandler);

  const PORT = getConfig("port");
  const httpServer = createServer(app);
  initSocket(httpServer, allowedOrigins);
  httpServer.listen(PORT, () => {
    log.info(`🚀 EdenHub is running on http://localhost:${PORT}`);
    startScheduledJobs();
  });
};

startServer();
