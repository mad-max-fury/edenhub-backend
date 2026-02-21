require("dotenv").config();
import express from "express";
import connectDocumentDB from "./db/connect";
import log from "./utils/logger";
import router from "./routes";
import appErrorHandler from "./errors/appErrorHandler";
import AppError from "./errors/appError";
import { getConfig } from "./config";
import { bootstrapPermissions } from "./utils/bootstrap.utils";

const session = require("express-session");
const passport = require("passport");
require("./lib/passport");

const startServer = async () => {
  const app = express();

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
  app.listen(PORT, () => {
    log.info(`🚀 EdenHub is running on http://localhost:${PORT}`);
  });
};

startServer();
