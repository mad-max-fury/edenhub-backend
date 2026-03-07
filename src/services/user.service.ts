import { FilterQuery } from "mongoose";
import UserModel, { User } from "../models/user.model";

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
