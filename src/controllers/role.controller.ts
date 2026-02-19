import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as roleService from "../services/role.service";

export const deleteRoleHandler = catchAsync(
  async (req: Request, res: Response) => {
    await roleService.deleteRole(req.params.id);
    res.status(204).json({ status: "success", data: null });
  },
);

export const assignClaimHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { roleId, claimId } = req.body;
    const role = await roleService.assignClaimToRole(roleId, claimId);
    res.status(200).json({ status: "success", data: role });
  },
);
