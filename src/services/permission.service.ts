import { FilterQuery } from "mongoose";
import PermissionModel, { Permission } from "../models/permission.model";

export const getPermissions = async (searchTerm: string) => {
  const searchFilter: FilterQuery<Permission> = searchTerm
    ? {
        $or: [{ name: { $regex: searchTerm, $options: "i" } }],
      }
    : {};

  const permissions = await PermissionModel.find(searchFilter);

  return { permissions };
};
