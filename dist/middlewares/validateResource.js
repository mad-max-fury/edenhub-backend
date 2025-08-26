"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const appError_1 = __importDefault(require("../errors/appError"));
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    }
    catch (e) {
        if (e instanceof zod_1.ZodError) {
            const errors = e.errors.map((error) => error.message);
            const message = errors.join(", ") || "Invalid or incomplete request body";
            return next(new appError_1.default(message, 417));
        }
        return next(e);
    }
};
exports.default = validate;
