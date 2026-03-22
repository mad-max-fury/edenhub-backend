import { FilterQuery } from "mongoose";
import GroupModel from "../models/group.model";
import { Group } from "../models/group.model";
import { IPaginationQuery } from "../utils/pagination.utils";
import PermissionModel from "../models/permission.model";
import AppError from "../errors/appError";

export const createGroup = async (data: Partial<Group>) => {
  return await GroupModel.create(data);
};

export const getAllGroups = async (
  query: IPaginationQuery,
  customFilter: FilterQuery<Group> = {},
) => {
  const { pageNumber, pageSize, orderBy, searchTerm } = query;
  const searchFilter: FilterQuery<Group> = searchTerm
    ? {
        $or: [{ name: { $regex: searchTerm, $options: "i" } }],
      }
    : {};
  const finalFilter = { ...searchFilter, ...customFilter };
  const skip = (pageNumber - 1) * pageSize;
  const sort = orderBy || "-createdAt";

  const [groups, totalCount] = await Promise.all([
    GroupModel.find(finalFilter)
      .populate("permissions")
      .sort(sort)
      .skip(skip)
      .limit(pageSize),
    GroupModel.countDocuments(finalFilter),
  ]);

  return { groups, totalCount };
};

export const getAllGroupsUnpaginated = async () => {
  const groups = await GroupModel.find().populate("permissions");
  return groups;
};

export const getGroupById = async (groupId: string) => {
  const group = await GroupModel.findById(groupId).populate("permissions");

  if (!group) {
    throw new AppError("Group not found", 404);
  }

  return group;
};

export const getPermissionsByGroupId = async (
  groupId: string,
  query: IPaginationQuery,
) => {
  const { pageNumber, pageSize, orderBy, searchTerm } = query;

  const group = await GroupModel.findById(groupId);
  if (!group) {
    throw new AppError("Group not found", 404);
  }

  const filter: any = {
    _id: { $in: group.permissions },
  };

  if (searchTerm) {
    filter.name = { $regex: searchTerm, $options: "i" };
  }

  const skip = (pageNumber - 1) * pageSize;

  const [permissions, totalCount] = await Promise.all([
    PermissionModel.find(filter)
      .sort(orderBy || "name")
      .skip(skip)
      .limit(pageSize),
    PermissionModel.countDocuments(filter),
  ]);

  return {
    name: group.name,
    permissions,
    totalCount,
  };
};

export const addPermissionsToGroup = async (
  groupId: string,
  permissionsId: string[],
) => {
  const foundPermissions = await PermissionModel.find({
    _id: { $in: permissionsId },
  });

  if (foundPermissions.length !== permissionsId.length) {
    throw new AppError(
      "One or more permission IDs are invalid or do not exist",
      404,
    );
  }

  const group = await GroupModel.findByIdAndUpdate(
    groupId,
    {
      $addToSet: {
        permissions: { $each: permissionsId },
      },
    },
    { new: true },
  ).populate("permissions");

  if (!group) {
    throw new AppError("Group not found", 404);
  }

  return group;
};

export const removePermissionFromGroup = async (
  groupId: string,
  permissionId: string,
) => {
  const group = await GroupModel.findByIdAndUpdate(
    groupId,
    { $pull: { permissions: permissionId } },
    { new: true },
  ).populate("permissions");

  if (!group) throw new AppError("Group not found", 404);
  return group;
};

export const updateGroupMetadata = async (id: string, data: Partial<Group>) => {
  return await GroupModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteGroup = async (id: string) => {
  return await GroupModel.findByIdAndDelete(id);
};
