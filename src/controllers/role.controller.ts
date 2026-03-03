import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as roleService from "../services/role.service";

export const createRoleHandler = catchAsync(
  async (req: Request, res: Response) => {
    const role = await roleService.createRole(req.body);
    res.status(201).json({ status: "success", data: role });
  },
);

export const getRolesHandler = catchAsync(
  async (req: Request, res: Response) => {
    const roles = await roleService.getAllRoles();
    res.status(200).json({ status: "success", data: roles });
  },
);

export const updateRoleHandler = catchAsync(
  async (req: Request, res: Response) => {
    const role = await roleService.updateRolePermissions(
      req.params.id,
      req.body,
    );
    res.status(200).json({ status: "success", data: role });
  },
);
export const deleteRoleHandler = catchAsync(
  async (req: Request, res: Response) => {
    await roleService.deleteRole(req.params.id);
    res.status(204).json({ status: "success", data: null });
  },
);
