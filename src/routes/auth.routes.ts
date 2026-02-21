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

import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, post, patch } = createAttributeRouter();

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

export default router;
