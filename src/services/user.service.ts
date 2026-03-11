import { FilterQuery } from "mongoose";
import UserModel, { User } from "../models/user.model";
import { DocumentType } from "@typegoose/typegoose";
import AppError from "../errors/appError";
import { IChangePasswordInput } from "../schemas/user.schemas";

export const findOneUser = async (filter: FilterQuery<User>) => {
  return await UserModel.findOne(filter);
};

export async function getUserById(userId: string) {
  return await UserModel.findById(userId).select("+profilePicture");
}

export async function getAllUsers() {
  return await UserModel.find().select("+profilePicture");
}

export async function updateUser(
  filter: FilterQuery<User>,
  data: Partial<User>,
) {
  return await UserModel.findOneAndUpdate(filter, data, {
    new: true,
    runValidators: true,
  }).select("+profilePicture");
}

export async function deleteUser(filter: FilterQuery<User>) {
  return await UserModel.findOneAndDelete(filter);
}

export const changeUserPassword = async (
  userId: string,
  { currentPassword, newPassword }: IChangePasswordInput,
): Promise<DocumentType<User>> => {
  const user = await UserModel.findById(userId).select("+password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError("The current password you entered is incorrect", 401);
  }
  user.password = newPassword;
  await user.save();

  return user;
};
