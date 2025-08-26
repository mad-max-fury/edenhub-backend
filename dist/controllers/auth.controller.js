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
exports.logoutHandler = exports.refreshTokenHandler = exports.resetPasswordHandler = exports.generateVerificationCodeHandler = exports.loginHandler = exports.createUserHandler = void 0;
const error_utils_1 = __importDefault(require("../utils/error.utils"));
const auth_service_1 = require("../services/auth.service");
const user_service_1 = require("../services/user.service");
const appError_1 = __importDefault(require("../errors/appError"));
exports.createUserHandler = (0, error_utils_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    body.email = body.email.toLowerCase();
    const existingUser = yield (0, user_service_1.findOneUser)({ email: body.email });
    if (existingUser)
        throw new appError_1.default("Email already exists", 409);
    yield (0, auth_service_1.createUser)(body);
    return res.status(201).json({
        status: "success",
        message: "User created successfully",
    });
}));
// Login
exports.loginHandler = (0, error_utils_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = yield (0, auth_service_1.loginUser)(email.toLowerCase(), password);
    return res.status(200).json({
        status: "success",
        message: "Login successful",
        data: { user, accessToken, refreshToken },
    });
}));
// Forgot password → generate code
exports.generateVerificationCodeHandler = (0, error_utils_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const verificationCode = yield (0, auth_service_1.generateVerificationCode)(email.toLowerCase());
    return res.status(200).json({
        status: "success",
        message: "Verification code sent",
        data: { verificationCode },
    });
}));
// Reset password
exports.resetPasswordHandler = (0, error_utils_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, newPassword, verificationCode } = req.body;
    yield (0, auth_service_1.resetPassword)(email.toLowerCase(), newPassword, verificationCode);
    return res.status(200).json({
        status: "success",
        message: "Password reset successful",
    });
}));
exports.refreshTokenHandler = (0, error_utils_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    const { accessToken } = yield (0, auth_service_1.refreshAccessToken)(refreshToken);
    return res.status(200).json({
        status: "success",
        data: { accessToken },
    });
}));
// Logout (invalidate refresh token client-side)
exports.logoutHandler = (0, error_utils_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
}));
