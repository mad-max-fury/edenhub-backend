import UserModal, { User } from "../models/user.model";
import log from "../utils/logger";

// Create User
export async function createUser(input: Partial<User>) {
  try {
    return await UserModal.create(input);
  } catch (e: any) {
    log.error(e);
    return {
      status: "failed",
      error: e?.message,
    };
  }
}
// Find One User
export const findOneUser = async (input: Partial<User>) => {
  try {
    return await UserModal.findOne(input);
  } catch (e: any) {
    log.error(e);
    return {
      status: "failed",
      message: e.message,
    };
  }
};
// Get User by ID
export async function getUserById(userId: string) {
  try {
    const user = await UserModal.findById(userId);
    if (!user) {
      return {
        status: "failed",
        error: "User not found",
      };
    }
    return user;
  } catch (e: any) {
    log.error(e);
    return {
      status: "failed",
      error: e?.message,
    };
  }
}

// Update User
export async function updateUser(userId: string, updateData: Partial<User>) {
  try {
    const updatedUser = await UserModal.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    if (!updatedUser) {
      return {
        status: "failed",
        error: "User not found",
      };
    }
    return updatedUser;
  } catch (e: any) {
    log.error(e);
    return {
      status: "failed",
      error: e?.message,
    };
  }
}

// Delete User
export async function deleteUser(userId: string) {
  try {
    const deletedUser = await UserModal.findByIdAndDelete(userId);
    if (!deletedUser) {
      return {
        status: "failed",
        error: "User not found",
      };
    }
    return {
      status: "success",
      message: "User deleted successfully",
    };
  } catch (e: any) {
    log.error(e);
    return {
      status: "failed",
      error: e?.message,
    };
  }
}
