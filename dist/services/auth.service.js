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
exports.changePassword = exports.refreshAccessToken = exports.generateVerificationCode = exports.resetPassword = exports.getUserProfile = exports.loginUser = exports.createUser = exports.signToken = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const appError_1 = __importDefault(require("../errors/appError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("config"));
const argon2_1 = __importDefault(require("argon2"));
const signToken = (userId, expiresIn) => {
    const secret = config_1.default.get("jwtSecret");
    if (!secret) {
        throw new appError_1.default("JWT secret not configured", 500);
    }
    return jsonwebtoken_1.default.sign({ id: userId }, secret, {
        expiresIn,
    });
};
exports.signToken = signToken;
function createUser(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield user_model_1.default.create(data);
    });
}
exports.createUser = createUser;
const loginUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email }).select("+password");
    if (!user)
        throw new appError_1.default("Invalid email or password", 401);
    const isPasswordMatch = yield user.comparePassword(password);
    if (!isPasswordMatch)
        throw new appError_1.default("Invalid email or password", 401);
    const jwtExpiresIn = config_1.default.get("jwtExpiresIn");
    const jwtRefreshExpiresIn = config_1.default.get("jwtRefreshExpiresIn");
    const accessToken = (0, exports.signToken)(user.id, jwtExpiresIn);
    const refreshToken = (0, exports.signToken)(user.id, jwtRefreshExpiresIn);
    return { user: user.toJson(), accessToken, refreshToken };
});
exports.loginUser = loginUser;
const getUserProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(userId);
    if (!user)
        throw new appError_1.default("User not found", 404);
    return user.toJson();
});
exports.getUserProfile = getUserProfile;
const resetPassword = (email, newPassword, verificationCode) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email, verificationCode });
    if (!user)
        throw new appError_1.default("Invalid verification code", 400);
    user.password = yield argon2_1.default.hash(newPassword);
    user.verificationCode = undefined;
    yield user.save();
    return true;
});
exports.resetPassword = resetPassword;
const generateVerificationCode = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email });
    if (!user)
        throw new appError_1.default("User not found", 404);
    const verificationCode = Math.random().toString(36).substring(2, 8);
    user.verificationCode = verificationCode;
    yield user.save();
    return verificationCode;
});
exports.generateVerificationCode = generateVerificationCode;
// 🔑 Refresh token
const refreshAccessToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const secret = config_1.default.get("jwtSecret");
        if (!secret) {
            throw new appError_1.default("JWT secret not configured", 500);
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = yield user_model_1.default.findById(decoded.id);
        if (!user)
            throw new appError_1.default("User not found", 404);
        const jwtExpiresIn = config_1.default.get("jwtExpiresIn");
        const accessToken = (0, exports.signToken)(user.id, jwtExpiresIn);
        return { accessToken };
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new appError_1.default("Invalid refresh token", 401);
        }
        throw err;
    }
});
exports.refreshAccessToken = refreshAccessToken;
const changePassword = (userId, currentPassword, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(userId).select("+password");
    if (!user)
        throw new appError_1.default("User not found", 404);
    const isMatch = yield user.comparePassword(currentPassword);
    if (!isMatch)
        throw new appError_1.default("Current password is incorrect", 401);
    user.password = yield argon2_1.default.hash(newPassword);
    yield user.save();
    return true;
});
exports.changePassword = changePassword;
