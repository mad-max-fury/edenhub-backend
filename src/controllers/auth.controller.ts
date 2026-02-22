import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import {
  createUser,
  generateVerificationCode,
  loginUser,
  resetPassword,
  refreshAccessToken,
  signToken,
} from "../services/auth.service";
import {
  CreateUserInputSchema,
  IVerifyGoogleCodeInput,
} from "../schemas/auth.schemas";
import { findOneUser } from "../services/user.service";
import AppError from "../errors/appError";
import { User } from "../models/user.model";
import { findRoleByName } from "../services/role.service";
import { AuthEmailTemplates } from "../templates/authEmail.templates";
import { mailer } from "../utils/mailer.utils";
import { getConfig } from "../config";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const client = new OAuth2Client(
  getConfig("googleClientId"),
  getConfig("googleClientSecret"),
  "postmessage",
);

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

export const googleVerifyHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { code } = req.body as IVerifyGoogleCodeInput;

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const userInfo = await client.request<any>({
      url: "https://www.googleapis.com/oauth2/v3/userinfo",
    });

    const {
      email,
      given_name,
      family_name,
      sub: googleId,
      picture,
    } = userInfo.data;

    let user = await findOneUser({ email });

    if (!user) {
      const defaultRole = await findRoleByName("customer");
      user = await createUser({
        firstName: given_name,
        lastName: family_name,
        email: email,
        password: googleId,
        role: defaultRole?._id,
        isVerified: true,
        profilePicture: picture,
      });
    }
    const accessToken = signToken(
      user.id,
      getConfig("jwtExpiresIn") as jwt.SignOptions["expiresIn"],
    );
    const refreshToken = signToken(
      user.id,
      getConfig("jwtRefreshExpiresIn") as jwt.SignOptions["expiresIn"],
    );

    const userJson = user.toJSON();
    const groups = (user.role as any)?.groups || [];
    return res.status(200).json({
      status: "success",
      data: { user: userJson, groups, accessToken, refreshToken },
    });
  },
);
