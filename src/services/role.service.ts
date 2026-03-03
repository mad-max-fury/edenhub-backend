import RoleModel from "../models/role.model";
import { Role } from "../models/role.model";

export const createRole = async (data: Partial<Role>) => {
  return await RoleModel.create(data);
};

export const getAllRoles = async () => {
  return await RoleModel.find().populate("groups").populate("permissions");
};

export const updateRolePermissions = async (
  roleId: string,
  payload: { groups?: string[]; permissions?: string[] },
) => {
  return await RoleModel.findByIdAndUpdate(
    roleId,
    {
      $set: {
        groups: payload.groups || [],
        permissions: payload.permissions || [],
      },
    },
    { new: true },
  ).populate("groups permissions");
};

export const deleteRole = async (id: string) => {
  return await RoleModel.findByIdAndDelete(id);
};

export const findRoleByName = async (name: string) => {
  return await RoleModel.findOne({ name });
};
