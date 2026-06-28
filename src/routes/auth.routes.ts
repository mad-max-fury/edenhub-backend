import validateResource from "../middlewares/validateResource";
import auth from "../middlewares/auth";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createUserSchema,
  verifyGoogleCodeSchema,
} from "../schemas/auth.schemas";
import {
  createUserHandler,
  loginHandler,
  generateVerificationCodeHandler,
  resetPasswordHandler,
  refreshTokenHandler,
  logoutHandler,
  googleVerifyHandler,
  meHandler,
  updateMeHandler,
  verifyTwoFactorHandler,
  requestDeletionHandler,
  cancelDeletionHandler,
  deletionStatusHandler,
  generate2FAHandler,
  enable2FAHandler,
  enableEmail2FAHandler,
  disable2FAHandler,
} from "../controllers/auth.controller";

import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, post, patch, get, delete: del } = createAttributeRouter();

get(
  "/me",
  {
    resource: "Auth",
    action: "Read",
    group: "System Access",
    name: "get_auth_me",
  },
  auth,
  meHandler,
);

patch(
  "/me",
  {
    resource: "Auth",
    action: "Write",
    group: "System Access",
    name: "patch_auth_me",
  },
  auth,
  updateMeHandler,
);

post(
  "/signup",
  {
    resource: "Auth",
    action: "Write",
    group: "System Access",
    name: "post_auth_signup",
  },
  validateResource(createUserSchema),
  createUserHandler,
);

post(
  "/login",
  {
    resource: "Auth",
    action: "Read",
    group: "System Access",
    name: "post_auth_login",
  },
  validateResource(loginSchema),
  loginHandler,
);

post(
  "/2fa/verify",
  {
    resource: "Auth",
    action: "Read",
    group: "System Access",
    name: "post_auth_2fa_verify",
  },
  verifyTwoFactorHandler,
);

post(
  "/forgot-password",
  {
    resource: "Auth",
    action: "Write",
    group: "Account Recovery",
    name: "post_auth_forgot_password",
  },
  validateResource(forgotPasswordSchema),
  generateVerificationCodeHandler,
);

patch(
  "/reset-password",
  {
    resource: "Auth",
    action: "Write",
    group: "Account Recovery",
    name: "patch_auth_reset_password",
  },
  validateResource(resetPasswordSchema),
  resetPasswordHandler,
);

post(
  "/refresh-token",
  {
    resource: "Auth",
    action: "Read",
    group: "System Access",
    name: "post_auth_refresh_token",
  },
  refreshTokenHandler,
);

post(
  "/google/verify",
  {
    resource: "Auth",
    action: "Write",
    group: "System Access",
    name: "post_auth_google_verify",
  },
  validateResource(verifyGoogleCodeSchema),
  googleVerifyHandler,
);

post(
  "/logout",
  {
    resource: "Auth",
    action: "Write",
    group: "System Access",
    name: "post_auth_logout",
  },
  auth,
  logoutHandler,
);

// Customer 2FA
post(
  "/2fa/setup",
  { resource: "Auth", action: "Write", group: "System Access", name: "post_auth_2fa_setup" },
  auth,
  generate2FAHandler,
);

post(
  "/2fa/enable",
  { resource: "Auth", action: "Write", group: "System Access", name: "post_auth_2fa_enable" },
  auth,
  enable2FAHandler,
);

post(
  "/2fa/enable-email",
  { resource: "Auth", action: "Write", group: "System Access", name: "post_auth_2fa_enable_email" },
  auth,
  enableEmail2FAHandler,
);

post(
  "/2fa/disable",
  { resource: "Auth", action: "Write", group: "System Access", name: "post_auth_2fa_disable" },
  auth,
  disable2FAHandler,
);

// Account deletion (30-day grace period)
post(
  "/me/delete",
  { resource: "Auth", action: "Write", group: "System Access", name: "post_auth_delete_account" },
  auth,
  requestDeletionHandler,
);

patch(
  "/me/delete/cancel",
  { resource: "Auth", action: "Write", group: "System Access", name: "patch_auth_cancel_deletion" },
  auth,
  cancelDeletionHandler,
);

get(
  "/me/delete/status",
  { resource: "Auth", action: "Read", group: "System Access", name: "get_auth_deletion_status" },
  auth,
  deletionStatusHandler,
);

export default router;
