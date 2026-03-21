import { FilterQuery } from "mongoose";
import RoleModel from "../models/role.model";
import { Role } from "../models/role.model";
import { IPaginationQuery } from "../utils/pagination.utils";
import AppError from "../errors/appError";
import { CreateRoleInput, UpdateRoleInput } from "../schemas/role.schema";

export const createRole = async (data: CreateRoleInput) => {
  const existingRole = await RoleModel.findOne({
    name: { $regex: new RegExp(`^${data.name}$`, "i") },
  });

  if (existingRole) {
    throw new AppError(`A role named "${data.name}" already exists`, 400);
  }
  return await RoleModel.create(data);
};

export const updateRole = async (id: string, data: UpdateRoleInput) => {
  if (data.name) {
    const nameExists = await RoleModel.findOne({
      name: { $regex: new RegExp(`^${data.name}$`, "i") },
      _id: { $ne: id },
    });

    if (nameExists) {
      throw new AppError(
        `Cannot update: Another role named "${data.name}" already exists`,
        400,
      );
    }
  }

  const updatedRole = await RoleModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  })
    .populate("groups.id")
    .populate("permissions");

  if (!updatedRole) {
    throw new AppError("Role not found", 404);
  }

  return updatedRole;
};

export const getAllRoles = async (query: IPaginationQuery) => {
  const { pageNumber, pageSize, orderBy, searchTerm } = query;

  const searchFilter: FilterQuery<Role> = searchTerm
    ? {
        name: { $regex: searchTerm, $options: "i" },
      }
    : {};

  const skip = (pageNumber - 1) * pageSize;
  const sort = orderBy || "-createdAt";

  const [roles, totalCount] = await Promise.all([
    RoleModel.find(searchFilter)
      .populate("groups.id")
      .populate("permissions")
      .sort(sort)
      .skip(skip)
      .limit(pageSize),
    RoleModel.countDocuments(searchFilter),
  ]);

  return { roles, totalCount };
};

export const getAllRolesUnpaginated = async () => {
  const roles = await RoleModel.find()
    .populate("groups.id")
    .populate("permissions");

  return { roles };
};

export const updateRolePermissions = async (
  roleId: string,
  payload: {
    groups?: Array<{ id: string; permissionsId: string[] }>;
    permissions?: string[];
  },
) => {
  const updatedRole = await RoleModel.findByIdAndUpdate(
    roleId,
    {
      $set: {
        ...(payload.groups && { groups: payload.groups }),
        ...(payload.permissions && { permissions: payload.permissions }),
      },
    },
    { new: true, runValidators: true },
  ).populate("groups.id permissions");

  if (!updatedRole) {
    throw new AppError("Role not found", 404);
  }

  return updatedRole;
};

export const deleteRole = async (id: string) => {
  const role = await RoleModel.findByIdAndDelete(id);
  if (!role) {
    throw new AppError("Role not found", 404);
  }
  return role;
};

export const findRoleByName = async (name: string) => {
  return await RoleModel.findOne({ name }).populate("groups.id permissions");
};

export const findRoleById = async (id: string) => {
  const role = await RoleModel.findById(id)
    .populate("groups.id")
    .populate("permissions");

  if (!role) {
    throw new AppError("Role not found", 404);
  }
  return role;
};
