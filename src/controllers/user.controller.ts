import { Response, Request } from "express";
import {
  findOneUser,
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers,
} from "../services/user.service";

import catchAsync from "../utils/error.utils";
import AppError from "../errors/appError";
import { User } from "../models/user.model";
import { AuthEmailTemplates } from "../templates/authEmail.templates";
import { mailer } from "../utils/mailer.utils";
import { createUser } from "../services/auth.service";
import { findRoleByName } from "../services/role.service";

export const getAllUsersHandler = catchAsync(
  async (req: Request, res: Response) => {
    const users = await getAllUsers();

    if (!users || users.length === 0) {
      throw new AppError("No users found", 404);
    }

    return res.status(200).json({
      status: "success",
      message: "Users retrieved successfully",
      data: users.map((user) => user.toJSON()),
    });
  },
);

export const getUserByIdHandler = catchAsync(
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    const user = await getUserById(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return res.status(200).json({
      status: "success",
      message: "User retrieved successfully",
      data: user.toJSON(),
    });
  },
);

export const onboardUserHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, roleName } = req.body;

    const role = await findRoleByName(roleName || "customer");
    if (!role) {
      throw new AppError("The specified role does not exist", 400);
    }

    const user = await createUser({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: role._id,
      isVerified: true,
    });

    await mailer.send(
      user.email,
      "Welcome to EdenHub - Account Created",
      AuthEmailTemplates.welcome(user.firstName),
    );

    return res.status(201).json({
      status: "success",
      message: `User onboarded successfully as ${roleName}`,
      data: user,
    });
  },
);

export const updateUserHandler = catchAsync(
  async (req: Request<{ id: string }, {}, Partial<User>>, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const updatedUser = await updateUser({ _id: id }, updates);

    if (!updatedUser) {
      throw new AppError("User not found or update failed", 404);
    }

    return res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: updatedUser.toJSON(),
    });
  },
);

export const deleteUserHandler = catchAsync(
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    const deletedUser = await deleteUser({ _id: id });

    if (!deletedUser) {
      throw new AppError("User not found or deletion failed", 404);
    }

    return res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  },
);
