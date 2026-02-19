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

export const createUserHandler = catchAsync(
  async (req: Request<{}, {}, CreateUserInputSchema>, res: Response) => {
    const { confirmPassword, ...userData } = req.body;
    userData.email = userData.email.toLowerCase();

    const existingUser = await findOneUser({ email: userData.email });
    if (existingUser) throw new AppError("Email already exists", 409);

    const user = await createUser(userData as Omit<Partial<User>, "role">);

    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: user,
    });
  },
);

export const loginHandler = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { user, menus, accessToken, refreshToken } = await loginUser(
    email.toLowerCase(),
    password,
  );

  return res.status(200).json({
    status: "success",
    message: "Login successful",
    data: {
      user,
      menus,
      accessToken,
      refreshToken,
    },
  });
});

export const generateVerificationCodeHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const verificationCode = await generateVerificationCode(
      email.toLowerCase(),
    );

    return res.status(200).json({
      status: "success",
      message: "Verification code sent",
      data: { verificationCode },
    });
  },
);

export const resetPasswordHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { email, newPassword, verificationCode } = req.body;
    await resetPassword(email.toLowerCase(), newPassword, verificationCode);

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
