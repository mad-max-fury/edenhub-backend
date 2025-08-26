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
exports.deleteUserHandler = exports.updateUserHandler = exports.getUserByIdHandler = exports.getAllUsersHandler = void 0;
const user_service_1 = require("../services/user.service");
const error_utils_1 = __importDefault(require("../utils/error.utils"));
const appError_1 = __importDefault(require("../errors/appError"));
exports.getAllUsersHandler = (0, error_utils_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield (0, user_service_1.getAllUsers)();
    if (!users || users.length === 0) {
        throw new appError_1.default("No users found", 404);
    }
    return res.status(200).json({
        status: "success",
        message: "Users retrieved successfully",
        data: users.map((user) => user.toJSON()),
    });
}));
exports.getUserByIdHandler = (0, error_utils_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = yield (0, user_service_1.getUserById)(id);
    if (!user) {
        throw new appError_1.default("User not found", 404);
    }
    return res.status(200).json({
        status: "success",
        message: "User retrieved successfully",
        data: user.toJSON(),
    });
}));
exports.updateUserHandler = (0, error_utils_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updates = req.body;
    const updatedUser = yield (0, user_service_1.updateUser)({ _id: id }, updates);
    if (!updatedUser) {
        throw new appError_1.default("User not found or update failed", 404);
    }
    return res.status(200).json({
        status: "success",
        message: "User updated successfully",
        data: updatedUser.toJSON(),
    });
}));
exports.deleteUserHandler = (0, error_utils_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deletedUser = yield (0, user_service_1.deleteUser)({ _id: id });
    if (!deletedUser) {
        throw new appError_1.default("User not found or deletion failed", 404);
    }
    return res.status(200).json({
        status: "success",
        message: "User deleted successfully",
    });
}));
