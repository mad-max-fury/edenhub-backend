import UserModel, { User } from "../models/user.model";
import AppError from "../errors/appError";
import jwt, { Secret } from "jsonwebtoken";
import { TOTP, generateSecret, generateURI, verify as otpVerify } from "otplib";
import QRCode from "qrcode";
import { getConfig } from "../config";

export const signToken = (
  userId: string,
  expiresIn: jwt.SignOptions["expiresIn"],
) => {
  return jwt.sign({ id: userId }, getConfig("jwtSecret") as Secret, {
    expiresIn,
  });
};

export async function createUser(data: Partial<User>) {
  return await UserModel.create(data);
}

const issueTokens = (user: any) => {
  const accessToken = signToken(
    user.id,
    getConfig("jwtExpiresIn") as jwt.SignOptions["expiresIn"],
  );
  const refreshToken = signToken(
    user.id,
    getConfig("jwtRefreshExpiresIn") as jwt.SignOptions["expiresIn"],
  );
  return {
    user: user.toJSON(),
    groups: (user.role as any)?.groups || [],
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email })
    .select("+password")
    .populate({
      path: "role",
      populate: [{ path: "groups" }, { path: "permissions" }],
    });

  if (!user) throw new AppError("Invalid email or password", 401);

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) throw new AppError("Invalid email or password", 401);

  if (user.twoFactorEnabled) {
    const method = user.twoFactorMethod || "email";
    if (method === "authenticator") {
      return { twoFactorRequired: true as const, twoFactorMethod: "authenticator" as const, user: user.toJSON() };
    }
    const code = Math.random().toString(36).substring(2, 8);
    user.verificationCode = code;
    await user.save();
    return { twoFactorRequired: true as const, twoFactorMethod: "email" as const, user: user.toJSON(), code };
  }

  return { twoFactorRequired: false as const, ...issueTokens(user) };
};

export const verifyTwoFactor = async (email: string, code: string) => {
  const user = await UserModel.findOne({ email }).populate(
    { path: "role", populate: { path: "groups" } },
  );
  if (!user) throw new AppError("Invalid email", 400);

  const method = user.twoFactorMethod || "email";

  if (method === "authenticator") {
    if (!user.twoFactorSecret) throw new AppError("Authenticator not configured", 400);
    const isValid = otpVerify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) throw new AppError("Invalid authenticator code", 400);
  } else {
    if (user.verificationCode !== code) throw new AppError("Invalid or expired code", 400);
    user.verificationCode = undefined;
    await user.save();
  }

  return issueTokens(user);
};

export const getUserProfile = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return user.toJSON();
};

export const resetPassword = async (
  email: string,
  newPassword: string,
  verificationCode: string,
) => {
  const user = await UserModel.findOne({ email, verificationCode });
  if (!user) throw new AppError("Invalid verification code", 400);

  user.password = newPassword;
  user.verificationCode = undefined;
  await user.save();
  return true;
};

export const generateVerificationCode = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  const verificationCode = Math.random().toString(36).substring(2, 8);
  user.verificationCode = verificationCode;
  await user.save();
  return verificationCode;
};

export const refreshAccessToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, getConfig("jwtSecret")) as {
      id: string;
    };

    const user = await UserModel.findById(decoded.id);
    if (!user) throw new AppError("User not found", 404);

    const accessToken = signToken(
      user.id,
      getConfig("jwtExpiresIn") as jwt.SignOptions["expiresIn"],
    );

    return { accessToken };
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError("Invalid refresh token", 401);
    }
    throw err;
  }
};

const totp = new TOTP();

export const generate2FASecret = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.twoFactorEnabled) throw new AppError("2FA is already enabled", 400);

  const secret = generateSecret();
  user.twoFactorSecret = secret;
  await user.save();

  const otpauth = generateURI({ issuer: "EdenHub", label: user.email, secret });
  const qrCodeUrl = await QRCode.toDataURL(otpauth);

  return { secret, qrCodeUrl };
};

export const enable2FA = async (userId: string, token: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (!user.twoFactorSecret) throw new AppError("Generate a 2FA secret first", 400);
  if (user.twoFactorEnabled && user.twoFactorMethod === "authenticator") throw new AppError("Authenticator 2FA is already enabled", 400);

  const isValid = otpVerify({ token, secret: user.twoFactorSecret });
  if (!isValid) throw new AppError("Invalid verification code", 400);

  user.twoFactorEnabled = true;
  user.twoFactorMethod = "authenticator";
  await user.save();

  return { enabled: true, method: "authenticator" };
};

export const enableEmail2FA = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.twoFactorEnabled && user.twoFactorMethod === "email") throw new AppError("Email 2FA is already enabled", 400);

  user.twoFactorEnabled = true;
  user.twoFactorMethod = "email";
  user.twoFactorSecret = undefined;
  await user.save();

  return { enabled: true, method: "email" };
};

export const disable2FA = async (userId: string, token?: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (!user.twoFactorEnabled) throw new AppError("2FA is not enabled", 400);

  if (user.twoFactorMethod === "authenticator") {
    if (!token) throw new AppError("Authenticator code required to disable", 400);
    const isValid = otpVerify({ token, secret: user.twoFactorSecret! });
    if (!isValid) throw new AppError("Invalid verification code", 400);
  }

  user.twoFactorEnabled = false;
  user.twoFactorMethod = "email";
  user.twoFactorSecret = undefined;
  await user.save();

  return { enabled: false };
};
