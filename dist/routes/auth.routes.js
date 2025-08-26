"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validateResource_1 = __importDefault(require("../middlewares/validateResource"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const auth_schemas_1 = require("../schemas/auth.schemas");
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
router.post("/signup", (0, validateResource_1.default)(auth_schemas_1.createUserSchema), auth_controller_1.createUserHandler);
router.post("/login", (0, validateResource_1.default)(auth_schemas_1.loginSchema), auth_controller_1.loginHandler);
router.post("/forgot-password", (0, validateResource_1.default)(auth_schemas_1.forgotPasswordSchema), auth_controller_1.generateVerificationCodeHandler);
router.patch("/reset-password", (0, validateResource_1.default)(auth_schemas_1.resetPasswordSchema), auth_controller_1.resetPasswordHandler);
router.post("/refresh-token", auth_controller_1.refreshTokenHandler);
router.post("/logout", auth_1.default, auth_controller_1.logoutHandler);
exports.default = router;
