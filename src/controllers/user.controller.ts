import { Response, Request, NextFunction } from "express";
import { CreateUserInputSchema } from "../schemas/user.schemas";
import { createUser } from "../services/user.service";
import catchAsync from "../utils/error.utils";
import { get } from "lodash";
import AppError from "../errors/appError";
import log from "../utils/logger";

export const createUserhandler = catchAsync(
  async (
    req: Request<{}, {}, CreateUserInputSchema>,
    res: Response,
    next: NextFunction
  ) => {
    const body = req.body;
    const user = await createUser(body);
    const error = get(user, "error");
    log.error(error);
    if (error) return next(new AppError("Possible Duplicate Key!", 409));
    return res.status(201).send({
      status: "success",
      message: "User created successfully",
    });
  }
);
