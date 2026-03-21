import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as groupService from "../services/group.service";
import {
  getPaginationMetadata,
  IPaginationQuery,
} from "../utils/pagination.utils";

export const createGroupHandler = catchAsync(
  async (req: Request, res: Response) => {
    const group = await groupService.createGroup(req.body);
    res.status(201).json({ status: "success", data: group });
  },
);

export const getGroupsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      searchTerm: req.query.searchTerm as string,
      orderBy: req.query.orderBy as string,
    };
    const { groups, totalCount } = await groupService.getAllGroups(query);

    const metadata = getPaginationMetadata(
      totalCount,
      query.pageNumber,
      query.pageSize,
    );
    res.status(200).json({
      status: "success",
      message: "Groups retrieved successfully",
      data: { data: groups, metadata },
    });
  },
);

export const getGroupsUnpaginatedHandler = catchAsync(
  async (req: Request, res: Response) => {
    const groups = await groupService.getAllGroupsUnpaginated();
    res.status(200).json({
      status: "success",
      message: "groups retrieved successfully",
      data: groups,
    });
  },
);
export const getGroupByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const group = await groupService.getGroupById(id);

    res.status(200).json({
      status: "success",
      message: "Group retrieved successfully",
      data: group,
    });
  },
);

export const getSingleGroupPermissionsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const query: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      searchTerm: req.query.searchTerm as string,
      orderBy: req.query.orderBy as string,
    };

    const { name, permissions, totalCount } =
      await groupService.getPermissionsByGroupId(id, query);

    const metadata = getPaginationMetadata(
      totalCount,
      query.pageNumber,
      query.pageSize,
    );

    return res.status(200).json({
      status: "success",
      message: `Permissions for group '${name}' retrieved successfully`,
      data: { data: permissions, metadata },
    });
  },
);

export const addPermissionToGroupHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id: groupId } = req.params;
    const { permissionsId } = req.body;

    const updatedGroup = await groupService.addPermissionsToGroup(
      groupId,
      permissionsId,
    );

    res.status(200).json({
      status: "success",
      message: "Permission added to group successfully",
      data: updatedGroup,
    });
  },
);

export const removePermissionFromGroupHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id: groupId } = req.params;
    const { permissionId } = req.body;

    const updatedGroup = await groupService.removePermissionFromGroup(
      groupId,
      permissionId,
    );

    res.status(200).json({
      status: "success",
      message: "Permission removed from group successfully",
      data: updatedGroup,
    });
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
