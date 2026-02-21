import GroupModel from "../models/group.model";
import { Group } from "../models/group.model";

export const createGroup = async (data: Partial<Group>) => {
  return await GroupModel.create(data);
};

export const getAllGroups = async () => {
  return await GroupModel.find().populate("permissions").sort({ order: 1 });
};

export const updateGroupMetadata = async (id: string, data: Partial<Group>) => {
  return await GroupModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteGroup = async (id: string) => {
  return await GroupModel.findByIdAndDelete(id);
};
