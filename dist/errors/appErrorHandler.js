"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const appError_1 = __importDefault(require("./appError"));
const logger_1 = __importDefault(require("../utils/logger"));
const sendErrorDev = (err, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    logger_1.default.error(err);
    return res.status(500).json({
        status: "error",
        message: "Internal Server Error 😓",
    });
};
const castErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new appError_1.default(message, 400);
};
const duplicateFieldError = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: "${field}" (${value}). Please use another value!`;
    return new appError_1.default(message, 409);
};
const validationError = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data: ${errors.join(". ")}`;
    return new appError_1.default(message, 400);
};
const JWTError = () => new appError_1.default("Invalid token. Please log in again.", 401);
const JWTExpiredError = () => new appError_1.default("Your session has expired. Please log in again.", 401);
const appErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    let error = Object.assign(Object.assign({}, err), { message: err.message });
    if (error.kind === "ObjectId")
        error = castErrorDB(error);
    if (error.code === 11000)
        error = duplicateFieldError(error);
    if (error.name === "ValidationError")
        error = validationError(error);
    if (error.name === "JsonWebTokenError")
        error = JWTError();
    if (error.name === "TokenExpiredError")
        error = JWTExpiredError();
    const environment = process.env.NODE_ENV || "production";
    if (environment === "development") {
        return sendErrorDev(err, res);
    }
    sendErrorProd(error, res);
};
exports.default = appErrorHandler;
