import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as roleService from "../services/role.service";
import {
  getPaginationMetadata,
  IPaginationQuery,
} from "../utils/pagination.utils";

export const createRoleHandler = catchAsync(
  async (req: Request, res: Response) => {
    const role = await roleService.createRole(req.body);

    return res.status(201).json({
      status: "success",
      message: "Role created successfully",
      data: role,
    });
  },
);

export const getRolesHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      searchTerm: req.query.searchTerm as string,
      orderBy: req.query.orderBy as string,
    };

    const { roles, totalCount } = await roleService.getAllRoles(query);
    const metadata = getPaginationMetadata(
      totalCount,
      query.pageNumber,
      query.pageSize,
    );

    return res.status(200).json({
      status: "success",
      message: "Roles retrieved successfully",
      data: { data: roles, metadata },
    });
  },
);

export const getRolesUnpaginatedHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { roles } = await roleService.getAllRolesUnpaginated();

    return res.status(200).json({
      status: "success",
      message: "Unpaginated roles retrieved successfully",
      data: roles,
    });
  },
);

export const getRoleByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const role = await roleService.findRoleById(req.params.id);

    return res.status(200).json({
      status: "success",
      message: "Role retrieved successfully",
      data: role,
    });
  },
);

export const updateRoleHandler = catchAsync(
  async (req: Request, res: Response) => {
    const role = await roleService.updateRole(req.params.id, req.body);

    return res.status(200).json({
      status: "success",
      message: "Role updated successfully",
      data: role,
    });
  },
);

export const deleteRoleHandler = catchAsync(
  async (req: Request, res: Response) => {
    await roleService.deleteRole(req.params.id);

    return res.status(204).json({
      status: "success",
      data: null,
    });
  },
);
