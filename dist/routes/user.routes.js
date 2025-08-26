"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = express_1.default.Router();
router.get("/", auth_1.default, user_controller_1.getAllUsersHandler);
router.get("/:id", auth_1.default, user_controller_1.getUserByIdHandler);
router.patch("/:id", auth_1.default, user_controller_1.updateUserHandler);
router.delete("/:id", auth_1.default, user_controller_1.deleteUserHandler);
exports.default = router;
