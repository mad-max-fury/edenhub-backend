import { FilterQuery } from "mongoose";
import ShopReviewModel, {
  ShopReview,
  ShopReviewStatus,
} from "../models/shopReview.model";
import AppError from "../errors/appError";
import { IPaginationQuery } from "../utils/pagination.utils";
import { CreateShopReviewInput } from "../schemas/shopReview.schema";

export const createShopReview = (
  data: CreateShopReviewInput & { user?: string },
) => ShopReviewModel.create({ ...data, status: ShopReviewStatus.Pending });

// Admin-authored reviews are trusted and published immediately.
export const adminCreateShopReview = (
  data: CreateShopReviewInput & { user?: string },
) => ShopReviewModel.create({ ...data, status: ShopReviewStatus.Approved });

// Public: approved reviews, most recent first.
export const getApprovedReviews = (limit = 12) =>
  ShopReviewModel.find({ status: ShopReviewStatus.Approved })
    .sort("-createdAt")
    .limit(limit);

// Admin: all reviews, paginated, optional status filter.
export const getAllShopReviews = async (
  query: IPaginationQuery & { status?: string },
) => {
  const { pageNumber, pageSize, searchTerm, status } = query;

  const filter: FilterQuery<ShopReview> = {};
  if (status && status !== "all") filter.status = status;
  if (searchTerm) {
    filter.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { comment: { $regex: searchTerm, $options: "i" } },
    ];
  }

  const skip = (pageNumber - 1) * pageSize;

  const [reviews, totalCount] = await Promise.all([
    ShopReviewModel.find(filter).sort("-createdAt").skip(skip).limit(pageSize),
    ShopReviewModel.countDocuments(filter),
  ]);

  return { reviews, totalCount };
};

export const updateShopReviewStatus = async (id: string, status: string) => {
  const review = await ShopReviewModel.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  );
  if (!review) throw new AppError("Review not found", 404);
  return review;
};

export const deleteShopReview = async (id: string) => {
  const review = await ShopReviewModel.findByIdAndDelete(id);
  if (!review) throw new AppError("Review not found", 404);
  return review;
};

export const getShopReviewStats = async () => {
  const [agg] = await ShopReviewModel.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  return {
    total: agg?.total ?? 0,
    pending: agg?.pending ?? 0,
    approved: agg?.approved ?? 0,
    rejected: agg?.rejected ?? 0,
    avgRating: agg?.avgRating ? Number(agg.avgRating.toFixed(2)) : 0,
  };
};
