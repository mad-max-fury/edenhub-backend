"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_routes_1 = __importDefault(require("./user.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const router = express_1.default.Router();
router.get("/healthcheck", (_, res) => res.sendStatus(200));
router.use("/api/user/", user_routes_1.default);
router.use("/api/auth/", auth_routes_1.default);
exports.default = router;
