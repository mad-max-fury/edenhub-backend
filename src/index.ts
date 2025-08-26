require("dotenv").config();

import express from "express";
import config from "config";
import connectDocumentDB from "./db/connect";
import log from "./utils/logger";
import router from "./routes";
import appErrorHandler from "./errors/appErrorHandler";
import AppError from "./errors/appError";
const session = require("express-session");
const passport = require("passport");
const passportSetup = require("./lib/passport");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: config.get<string>("sessionSecret"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 2,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(router);

app.all("**", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(appErrorHandler);
const PORT = config.get("port");

app.listen(PORT, () => {
  log.info(`Server is running on port http://localhost:${PORT}`);
  connectDocumentDB();
});
