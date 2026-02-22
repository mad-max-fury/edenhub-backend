import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import {
  createUser,
  generateVerificationCode,
  loginUser,
  resetPassword,
  refreshAccessToken,
} from "../services/auth.service";
import { CreateUserInputSchema } from "../schemas/auth.schemas";
import { findOneUser } from "../services/user.service";
import AppError from "../errors/appError";
import { User } from "../models/user.model";
import { findRoleByName } from "../services/role.service";
import { AuthEmailTemplates } from "../templates/authEmail.templates";
import { mailer } from "../utils/mailer.utils";

export const createUserHandler = catchAsync(
  async (req: Request<{}, {}, CreateUserInputSchema>, res: Response) => {
    const { confirmPassword, ...userData } = req.body;
    userData.email = userData.email.toLowerCase();

    const existingUser = await findOneUser({ email: userData.email });
    if (existingUser) throw new AppError("Email already exists", 409);

    const defaultRole = await findRoleByName("customer");
    if (!defaultRole) {
      return res
        .status(500)
        .json({ status: "failed", message: "Default system role missing" });
    }

    const user = await createUser({ ...userData, role: defaultRole?._id });

    await mailer.send(
      user.email,
      "Verify your EdenHub Account",
      AuthEmailTemplates.welcome(user.firstName),
    );

    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: user.toJSON() as User,
    });
  },
);

export const loginHandler = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { user, groups, accessToken, refreshToken } = await loginUser(
    email.toLowerCase(),
    password,
  );

  const loginData = {
    ip: req.ip || "Unknown",
    device: req.headers["user-agent"] || "Unknown Device",
    time: new Date().toLocaleString(),
  };

  await mailer.send(
    user.email,
    "New Login Detected",
    AuthEmailTemplates.loginAlert(user.firstName, loginData),
  );

  return res.status(200).json({
    status: "success",
    message: "Login successful",
    data: { user, groups, accessToken, refreshToken },
  });
});

export const generateVerificationCodeHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = await findOneUser({ email: email.toLowerCase() });
    if (!user) throw new AppError("User not found", 404);

    const verificationCode = await generateVerificationCode(
      email.toLowerCase(),
    );
    await mailer.send(
      user.email,
      "Reset Your Password",
      AuthEmailTemplates.forgotPassword(user.firstName, verificationCode),
    );

    return res.status(200).json({
      status: "success",
      message: "Verification code sent",
    });
  },
);

export const resetPasswordHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { email, newPassword, verificationCode } = req.body;

    const user = await findOneUser({ email: email.toLowerCase() });
    if (!user) throw new AppError("User not found", 404);

    await resetPassword(email.toLowerCase(), newPassword, verificationCode);

    await mailer.send(
      user.email,
      "Security Alert: Password Changed",
      AuthEmailTemplates.passwordChanged(user.firstName),
    );

    return res.status(200).json({
      status: "success",
      message: "Password reset successful",
    });
  },
);

export const refreshTokenHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const { accessToken } = await refreshAccessToken(refreshToken);

    return res.status(200).json({
      status: "success",
      data: { accessToken },
    });
  },
);

export const logoutHandler = catchAsync(
  async (_req: Request, res: Response) => {
    return res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  },
);
