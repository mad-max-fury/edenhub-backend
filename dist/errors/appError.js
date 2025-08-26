"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        this.message = `${(0, http_status_codes_1.getReasonPhrase)(statusCode)}: ${message}`;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.default = AppError;
