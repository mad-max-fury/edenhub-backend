import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/error.utils";
import UserModel from "../models/user.model";
import AppError from "../errors/appError";
import { Role } from "../models/role.model";
import { Permission } from "../models/permission.model";

export const hasPermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModel.findById(req.user?.id).populate({
      path: "role",
      populate: [
        { path: "permissions" },
        { path: "groups", populate: { path: "permissions" } },
      ],
    });

    const role = user?.role as Role;
    if (!role) throw new AppError("No role assigned", 403);

    const currentPath = req.route.path;
    const currentMethod = req.method.toUpperCase();

    const permissions = role.permissions as Permission[];
    const hasDirect = permissions.some(
      (p: Permission) =>
        p.endpoint.endsWith(currentPath) && p.method === currentMethod,
    );

    if (!hasDirect && role.name !== "super-admin") {
      throw new AppError("You do not have permission for this action", 403);
    }

    next();
  },
);
