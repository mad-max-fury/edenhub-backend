"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const config_1 = __importDefault(require("config"));
const dayjs_1 = __importDefault(require("dayjs"));
const level = config_1.default.get("logLevel") || "info";
const log = (0, pino_1.default)({
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            levelFirst: true,
            translateTime: "yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
        },
    },
    base: {
        app: "EdenHub Commerce App",
        env: process.env.NODE_ENV || "development",
    },
    level,
    timestamp: () => `,"time":"${(0, dayjs_1.default)().format("YYYY-MM-DDTHH:mm:ssZ[Z]")}"`,
    hooks: {
        logMethod(inputArgs, method) {
            if (typeof inputArgs[0] === "string") {
                inputArgs[0] = `[EdenHub]: ${inputArgs[0]}`;
            }
            method.apply(this, inputArgs);
        },
    },
});
exports.default = log;
