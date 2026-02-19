import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/error.utils";
import UserModel from "../models/user.model";
import AppError from "../errors/appError";

export const hasClaim = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const user = await UserModel.findById(req.user.id).populate({
      path: "role",
      populate: { path: "claims" },
    });

    const role = user?.role as any;
    if (!role || !role.claims) {
      throw new AppError(
        "Access denied: No role or permissions assigned.",
        403,
      );
    }

    const rawPath = (req.baseUrl + req.route.path)
      .replace(/\/+/g, "/")
      .replace(/\/\?\(\?=\/\|\$\)/g, "");

    const currentMethod = req.method.toUpperCase();

    const hasAccess = role.claims.some((claim: any) => {
      return (
        claim.endpoint === rawPath &&
        claim.method === currentMethod &&
        claim.isActive === true
      );
    });

    if (!hasAccess) {
      const claimSlug = `${req.method.toLowerCase()}_${rawPath
        .replace(/^\/api\//, "")
        .replace(/\//g, "_")
        .replace(/:(\w+)/g, "by_$1")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")}`;

      throw new AppError(
        `Access denied: You need the '${claimSlug}' claim to perform this action.`,
        403,
      );
    }

    next();
  },
);
