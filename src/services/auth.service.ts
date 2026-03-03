import UserModel, { User } from "../models/user.model";
import AppError from "../errors/appError";
import jwt, { Secret } from "jsonwebtoken";
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

export const loginUser = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email })
    .select("+password")
    .populate({
      path: "role",
      populate: { path: "groups" },
    });

  if (!user) throw new AppError("Invalid email or password", 401);

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) throw new AppError("Invalid email or password", 401);

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

  return {
    user: userJson,
    groups,
    accessToken,
    refreshToken,
  };
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

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await UserModel.findById(userId).select("+password");
  if (!user) throw new AppError("User not found", 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError("Current password is incorrect", 401);

  user.password = newPassword;
  await user.save();
  return true;
};
