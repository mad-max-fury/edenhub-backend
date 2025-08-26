"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("config"));
const connect_1 = __importDefault(require("./db/connect"));
const logger_1 = __importDefault(require("./utils/logger"));
const routes_1 = __importDefault(require("./routes"));
const appErrorHandler_1 = __importDefault(require("./errors/appErrorHandler"));
const appError_1 = __importDefault(require("./errors/appError"));
const session = require("express-session");
const passport = require("passport");
const passportSetup = require("./lib/passport");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(session({
    secret: config_1.default.get("sessionSecret"),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 2,
    },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(routes_1.default);
app.all("**", (req, res, next) => {
    next(new appError_1.default(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(appErrorHandler_1.default);
const PORT = config_1.default.get("port");
app.listen(PORT, () => {
    logger_1.default.info(`Server is running on port http://localhost:${PORT}`);
    (0, connect_1.default)();
});
