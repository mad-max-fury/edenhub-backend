import { Response, Request } from "express";
import {
  getUserById,
  updateUser,
  deleteUser,
  changeUserPassword,
  getStaffUsers,
  getCustomerUsers,
} from "../services/user.service";

import catchAsync from "../utils/error.utils";
import AppError from "../errors/appError";
import { User } from "../models/user.model";
import { AuthEmailTemplates } from "../templates/authEmail.templates";
import { mailer } from "../utils/mailer.utils";
import { createUser } from "../services/auth.service";
import { findRoleById } from "../services/role.service";

import {
  getPaginationMetadata,
  IPaginationQuery,
} from "../utils/pagination.utils";
import { generateStaffId } from "../utils/generateStaffId.utils";

export const getCustomersHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      searchTerm: req.query.searchTerm as string,
      orderBy: req.query.orderBy as string,
    };

    const { users, totalCount } = await getCustomerUsers(query);

    const metadata = getPaginationMetadata(
      totalCount,
      query.pageNumber,
      query.pageSize,
    );

    return res.status(200).json({
      status: "success",
      message: "Customers retrieved successfully",
      data: { metadata, data: users },
    });
  },
);

export const getStaffHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      searchTerm: req.query.searchTerm as string,
      orderBy: req.query.orderBy as string,
    };
    const roleId = (req.query.roleId as string) || undefined;

    const { users, totalCount } = await getStaffUsers(query, roleId);

    const metadata = getPaginationMetadata(
      totalCount,
      query.pageNumber,
      query.pageSize,
    );

    return res.status(200).json({
      status: "success",
      message: "Staff retrieved successfully",

      data: { metadata, data: users },
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

    const data = user.toJSON();

    return res.status(200).json({
      status: "success",
      message: "User retrieved successfully",
      data,
    });
  },
);

export const onboardUserHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, role: roleId } = req.body;

    const role = await findRoleById(roleId);
    if (!role) {
      throw new AppError("The specified role does not exist", 400);
    }

    const staffId = await generateStaffId();

    const user = await createUser({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: role._id,
      isVerified: true,
      staffId,
    });

    await mailer.send(
      user.email,
      "Welcome to EdenHub - Account Created",
      AuthEmailTemplates.welcome(user.firstName),
    );

    return res.status(201).json({
      status: "success",
      message: `User onboarded successfully as ${role.name}`,
      data: user.toJSON(),
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

    const data = updatedUser.toJSON();

    return res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data,
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
export const changePasswordHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?.id as string;

    await changeUserPassword(userId, {
      currentPassword,
      newPassword,
      confirmPassword,
    });

    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  },
);
