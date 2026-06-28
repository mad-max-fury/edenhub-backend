import { FilterQuery, Types } from "mongoose";
import UserModel, { User, UserAddress } from "../models/user.model";
import OrderModel, { OrderStatus, PaymentStatus, FulfillmentStatus } from "../models/order.model";
import { DocumentType } from "@typegoose/typegoose";
import AppError from "../errors/appError";
import { IChangePasswordInput } from "../schemas/user.schemas";
import { IPaginationQuery } from "../utils/pagination.utils";
import { findRoleByName } from "./role.service";
import log from "../utils/logger";

export const findOneUser = async (filter: FilterQuery<User>) => {
  return await UserModel.findOne(filter);
};

export async function getUserById(userId: string) {
  return await UserModel.findById(userId).select("+profilePicture");
}

export async function getAllUsers(
  query: IPaginationQuery,
  customFilter: FilterQuery<User> = {},
) {
  const { pageNumber, pageSize, orderBy, searchTerm } = query;
  const searchFilter: FilterQuery<User> = searchTerm
    ? {
        $or: [
          { firstName: { $regex: searchTerm, $options: "i" } },
          { lastName: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
        ],
      }
    : {};
  const finalFilter = { ...searchFilter, ...customFilter };
  const skip = (pageNumber - 1) * pageSize;
  const sort = orderBy || "-createdAt";

  const [users, totalCount] = await Promise.all([
    UserModel.find(finalFilter)
      .populate("role")
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .select("+profilePicture"),
    UserModel.countDocuments(finalFilter),
  ]);

  return { users, totalCount };
}

export async function getCustomerUsers(query: IPaginationQuery) {
  const customerRole = await findRoleByName("customer");
  const roleId = customerRole?._id;
  return getAllUsers(query, { role: roleId });
}

export async function getStaffUsers(query: IPaginationQuery, id?: string) {
  const customerRole = await findRoleByName("customer");
  const roleId = customerRole?._id;

  return getAllUsers(query, { role: id ?? { $ne: roleId } });
}

const WISHLIST_FIELDS =
  "name coverImage images basePrice discount status averageRating totalReviews quantity variants brand";

export async function getWishlist(userId: string) {
  const user = await UserModel.findById(userId).populate({
    path: "wishlist",
    select: WISHLIST_FIELDS,
  });
  return user?.wishlist ?? [];
}

export async function addToWishlist(userId: string, productId: string) {
  await UserModel.findByIdAndUpdate(userId, {
    $addToSet: { wishlist: productId },
  });
  return getWishlist(userId);
}

export async function removeFromWishlist(userId: string, productId: string) {
  await UserModel.findByIdAndUpdate(userId, {
    $pull: { wishlist: productId },
  });
  return getWishlist(userId);
}

// ─── Address book ───────────────────────────────────────────────────────────

export async function getAddresses(userId: string) {
  const user = await UserModel.findById(userId);
  return user?.addresses ?? [];
}

export async function addAddress(
  userId: string,
  data: Partial<UserAddress>,
) {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const makeDefault = data.isDefault || user.addresses.length === 0;
  if (makeDefault) user.addresses.forEach((a) => (a.isDefault = false));

  user.addresses.push({ ...data, isDefault: makeDefault } as UserAddress);
  await user.save();
  return user.addresses;
}

export async function updateAddress(
  userId: string,
  addressId: string,
  data: Partial<UserAddress>,
) {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const address = (user.addresses as any).id(addressId);
  if (!address) throw new AppError("Address not found", 404);

  if (data.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  Object.assign(address, data);
  await user.save();
  return user.addresses;
}

export async function deleteAddress(userId: string, addressId: string) {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  (user.addresses as any).pull({ _id: new Types.ObjectId(addressId) });
  if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) {
    user.addresses[0].isDefault = true;
  }
  await user.save();
  return user.addresses;
}

export async function setDefaultAddress(userId: string, addressId: string) {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  let found = false;
  user.addresses.forEach((a) => {
    a.isDefault = String((a as any)._id) === addressId;
    if (a.isDefault) found = true;
  });
  if (!found) throw new AppError("Address not found", 404);

  await user.save();
  return user.addresses;
}

export async function getCustomerStats() {
  const customerRole = await findRoleByName("customer");
  const base: FilterQuery<User> = customerRole?._id
    ? { role: customerRole._id }
    : {};

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [total, active, verified, newThisMonth] = await Promise.all([
    UserModel.countDocuments(base),
    UserModel.countDocuments({ ...base, isActive: true }),
    UserModel.countDocuments({ ...base, isVerified: true }),
    UserModel.countDocuments({ ...base, createdAt: { $gte: startOfMonth } }),
  ]);

  return { total, active, verified, newThisMonth };
}

export async function updateUser(
  filter: FilterQuery<User>,
  data: Partial<User>,
) {
  return await UserModel.findOneAndUpdate(filter, data, {
    new: true,
    runValidators: true,
  }).select("+profilePicture");
}

export async function deleteUser(filter: FilterQuery<User>) {
  return await UserModel.findOneAndDelete(filter);
}

export const changeUserPassword = async (
  userId: string,
  { currentPassword, newPassword }: IChangePasswordInput,
): Promise<DocumentType<User>> => {
  const user = await UserModel.findById(userId).select("+password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError("The current password you entered is incorrect", 401);
  }
  user.password = newPassword;
  await user.save();

  return user;
};

export const requestAccountDeletion = async (userId: string, reason?: string) => {
  const pending = await OrderModel.countDocuments({
    customer: userId,
    status: { $nin: [OrderStatus.Completed, OrderStatus.Cancelled] },
    fulfillmentStatus: { $ne: FulfillmentStatus.Delivered },
    paymentStatus: { $ne: PaymentStatus.Refunded },
  });
  if (pending > 0) {
    throw new AppError(
      `You have ${pending} pending order${pending > 1 ? "s" : ""}. Complete or cancel them before deleting your account.`,
      400,
    );
  }

  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  user.deletionRequestedAt = new Date();
  user.deletionReason = reason || "User requested deletion";
  await user.save();

  return { deletionRequestedAt: user.deletionRequestedAt };
};

export const cancelAccountDeletion = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (!user.deletionRequestedAt) throw new AppError("No deletion request found", 400);

  user.deletionRequestedAt = undefined;
  user.deletionReason = undefined;
  await user.save();

  return { cancelled: true };
};

export const getDeletionStatus = async (userId: string) => {
  const user = await UserModel.findById(userId).select("deletionRequestedAt deletionReason");
  if (!user) throw new AppError("User not found", 404);

  if (!user.deletionRequestedAt) return { requested: false };

  const deleteAt = new Date(user.deletionRequestedAt);
  deleteAt.setDate(deleteAt.getDate() + 30);

  return {
    requested: true,
    requestedAt: user.deletionRequestedAt,
    reason: user.deletionReason,
    scheduledDeletionDate: deleteAt,
    daysRemaining: Math.max(0, Math.ceil((deleteAt.getTime() - Date.now()) / 86_400_000)),
  };
};

export const purgeExpiredDeletions = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const expired = await UserModel.find({
    deletionRequestedAt: { $lte: cutoff },
  });

  let purged = 0;
  for (const user of expired) {
    await UserModel.findByIdAndDelete(user._id);
    purged++;
  }

  if (purged > 0) log.info(`Account purge: ${purged} account(s) permanently deleted`);
  return { purged };
};
