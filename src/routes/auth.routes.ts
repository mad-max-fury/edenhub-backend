import express from "express";
import validateResource from "../middlewares/validateResource";
import auth from "../middlewares/auth";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createUserSchema,
} from "../schemas/auth.schemas";
import {
  createUserHandler,
  loginHandler,
  generateVerificationCodeHandler,
  resetPasswordHandler,
  refreshTokenHandler,
  logoutHandler,
} from "../controllers/auth.controller";

const router = express.Router();

router.post("/signup", validateResource(createUserSchema), createUserHandler);

router.post("/login", validateResource(loginSchema), loginHandler);

router.post(
  "/forgot-password",
  validateResource(forgotPasswordSchema),
  generateVerificationCodeHandler
);

router.patch(
  "/reset-password",
  validateResource(resetPasswordSchema),
  resetPasswordHandler
);

router.post("/refresh-token", refreshTokenHandler);

router.post("/logout", auth, logoutHandler);

export default router;
