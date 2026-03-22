import { FilterQuery } from "mongoose";
import UserModel, { User } from "../models/user.model";
import { DocumentType } from "@typegoose/typegoose";
import AppError from "../errors/appError";
import { IChangePasswordInput } from "../schemas/user.schemas";
import { IPaginationQuery } from "../utils/pagination.utils";
import { findRoleByName } from "./role.service";

export const findOneUser = async (filter: FilterQuery<User>) => {
  return await UserModel.findOne(filter);
};

export async function getUserById(userId: string) {
  return await UserModel.findById(userId).select("+profilePicture");
}

export async function getAllUsers(
  query: IPaginationQuery,
  customFilter: FilterQuery<User> = {},
) {
  const { pageNumber, pageSize, orderBy, searchTerm } = query;
  const searchFilter: FilterQuery<User> = searchTerm
    ? {
        $or: [
          { firstName: { $regex: searchTerm, $options: "i" } },
          { lastName: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
        ],
      }
    : {};
  const finalFilter = { ...searchFilter, ...customFilter };
  const skip = (pageNumber - 1) * pageSize;
  const sort = orderBy || "-createdAt";

  const [users, totalCount] = await Promise.all([
    UserModel.find(finalFilter)
      .populate("role")
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .select("+profilePicture"),
    UserModel.countDocuments(finalFilter),
  ]);

  return { users, totalCount };
}

export async function getCustomerUsers(query: IPaginationQuery) {
  const customerRole = await findRoleByName("customer");
  const roleId = customerRole?._id;
  return getAllUsers(query, { role: roleId });
}

export async function getStaffUsers(query: IPaginationQuery, id?: string) {
  const customerRole = await findRoleByName("customer");
  const roleId = customerRole?._id;

  return getAllUsers(query, { role: id ?? { $ne: roleId } });
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
