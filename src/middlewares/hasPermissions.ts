import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/error.utils";
import UserModel from "../models/user.model";
import AppError from "../errors/appError";

export const hasPermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModel.findById(req.user?.id).populate({
      path: "role",
      populate: [
        { path: "permissions" },
        { path: "groups", populate: { path: "permissions" } },
      ],
    });

    const role = user?.role as any;
    if (!role) throw new AppError("No role assigned", 403);

    const currentPath = req.route.path;
    const currentMethod = req.method.toUpperCase();

    // 1. Check direct permissions
    const hasDirect = role.permissions.some(
      (p: any) => p.endpoint === currentPath && p.method === currentMethod,
    );

    // 2. Check group permissions
    const hasViaGroup = role.groups.some((group: any) =>
      group.permissions.some(
        (p: any) => p.endpoint === currentPath && p.method === currentMethod,
      ),
    );

    if (!hasDirect && !hasViaGroup) {
      throw new AppError("You do not have permission for this action", 403);
    }

    next();
  },
);
