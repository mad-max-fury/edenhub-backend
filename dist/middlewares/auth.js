"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const appError_1 = __importDefault(require("../errors/appError"));
const user_service_1 = require("../services/user.service");
const auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new appError_1.default("Unauthorized access. Token is missing.", 401);
        }
        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECREET;
        if (!secret) {
            throw new appError_1.default("JWT secret not configured.", 500);
        }
        // Verify the token
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        const user = yield (0, user_service_1.findOneUser)({ _id: decoded.id });
        if (!user) {
            throw new appError_1.default("User associated with this token no longer exists.", 401);
        }
        next();
    }
    catch (err) {
        if (err.name === "JsonWebTokenError") {
            return next(new appError_1.default("Invalid token. Please log in again.", 401));
        }
        if (err.name === "TokenExpiredError") {
            return next(new appError_1.default("Your token has expired. Please log in again.", 401));
        }
        next(err);
    }
});
exports.default = auth;
