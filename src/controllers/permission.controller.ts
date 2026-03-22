import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as permissionService from "../services/permission.service";
export const getPermissionsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const searchTerm = req.query.searchTerm as string;

    const { permissions } = await permissionService.getPermissions(searchTerm);

    res.status(200).json({
      status: "success",
      message: "permissions retrieved successfully",
      data: permissions,
    });
  },
);
