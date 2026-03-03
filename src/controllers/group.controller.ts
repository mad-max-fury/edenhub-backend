import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as groupService from "../services/group.service";

export const createGroupHandler = catchAsync(
  async (req: Request, res: Response) => {
    const group = await groupService.createGroup(req.body);
    res.status(201).json({ status: "success", data: group });
  },
);

export const getGroupsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const groups = await groupService.getAllGroups();
    res.status(200).json({ status: "success", data: groups });
  },
);

export const updateGroupHandler = catchAsync(
  async (req: Request, res: Response) => {
    const group = await groupService.updateGroupMetadata(
      req.params.id,
      req.body,
    );
    res.status(200).json({ status: "success", data: group });
  },
);

export const deleteGroupHandler = catchAsync(
  async (req: Request, res: Response) => {
    await groupService.deleteGroup(req.params.id);
    res.status(204).json({ status: "success", data: null });
  },
);
