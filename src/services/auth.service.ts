import UserModel, { User } from "../models/user.model";
import AppError from "../errors/appError";
import jwt from "jsonwebtoken";
import config from "config";
import argon2 from "argon2";

export const signToken = (userId: string, expiresIn: string) => {
  return jwt.sign({ id: userId }, config.get<string>("jwtSecret"), {
    expiresIn,
  });
};

export async function createUser(data: Partial<User>) {
  return await UserModel.create(data);
}

export const loginUser = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email }).select("+password");
  if (!user) throw new AppError("Invalid email or password", 401);

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) throw new AppError("Invalid email or password", 401);

  const accessToken = signToken(user.id, config.get<string>("jwtExpiresIn"));
  const refreshToken = signToken(
    user.id,
    config.get<string>("jwtRefreshExpiresIn")
  );

  return { user: user.toJson(), accessToken, refreshToken };
};

export const getUserProfile = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return user.toJson();
};

export const resetPassword = async (
  email: string,
  newPassword: string,
  verificationCode: string
) => {
  const user = await UserModel.findOne({ email, verificationCode });
  if (!user) throw new AppError("Invalid verification code", 400);

  user.password = await argon2.hash(newPassword);
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

// 🔑 Refresh token
export const refreshAccessToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, config.get<string>("jwtSecret")) as {
      id: string;
    };

    const user = await UserModel.findById(decoded.id);
    if (!user) throw new AppError("User not found", 404);

    const accessToken = signToken(user.id, config.get<string>("jwtExpiresIn"));
    return { accessToken };
  } catch (err) {
    throw new AppError("Invalid refresh token", 401);
  }
};

// 🔒 Change password
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await UserModel.findById(userId).select("+password");
  if (!user) throw new AppError("User not found", 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError("Current password is incorrect", 401);

  user.password = await argon2.hash(newPassword);
  await user.save();
  return true;
};
