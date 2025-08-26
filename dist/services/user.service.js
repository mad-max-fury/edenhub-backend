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
exports.deleteUser = exports.updateUser = exports.getAllUsers = exports.getUserById = exports.findOneUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const findOneUser = (filter) => __awaiter(void 0, void 0, void 0, function* () {
    return yield user_model_1.default.findOne(filter);
});
exports.findOneUser = findOneUser;
function getUserById(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield user_model_1.default.findById(userId);
    });
}
exports.getUserById = getUserById;
function getAllUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield user_model_1.default.find();
    });
}
exports.getAllUsers = getAllUsers;
function updateUser(filter, data) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield user_model_1.default.findOneAndUpdate(filter, data, { new: true });
    });
}
exports.updateUser = updateUser;
function deleteUser(filter) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield user_model_1.default.findByIdAndDelete(filter);
    });
}
exports.deleteUser = deleteUser;
