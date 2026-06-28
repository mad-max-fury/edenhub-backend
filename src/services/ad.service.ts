import { FilterQuery } from "mongoose";
import AdModel, { Ad } from "../models/ad.model";
import AppError from "../errors/appError";
import { IPaginationQuery } from "../utils/pagination.utils";
import { CreateAdInput, UpdateAdInput } from "../schemas/ad.schema";

const PRODUCT_SELECT =
  "name slug coverImage images basePrice discount averageRating totalReviews quantity variants tags category audience status";

export const createAd = (data: CreateAdInput) => AdModel.create(data);

export const getAllAds = async (query: IPaginationQuery) => {
  const { pageNumber, pageSize, searchTerm } = query;

  const filter: FilterQuery<Ad> = {};
  if (searchTerm) filter.title = { $regex: searchTerm, $options: "i" };

  const skip = (pageNumber - 1) * pageSize;

  const [ads, totalCount] = await Promise.all([
    AdModel.find(filter).sort("order -createdAt").skip(skip).limit(pageSize),
    AdModel.countDocuments(filter),
  ]);

  return { ads, totalCount };
};

export const updateAd = async (id: string, data: UpdateAdInput) => {
  const ad = await AdModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!ad) throw new AppError("Ad not found", 404);
  return ad;
};

export const deleteAd = async (id: string) => {
  const ad = await AdModel.findByIdAndDelete(id);
  if (!ad) throw new AppError("Ad not found", 404);
  return ad;
};

// ─── Public ──────────────────────────────────────────────────────────────────

// Active ads for a placement, respecting the optional schedule window.
export const getActiveAds = async (placement?: string) => {
  const now = new Date();
  const filter: FilterQuery<Ad> = {
    isActive: true,
    $and: [
      {
        $or: [
          { startDate: { $exists: false } },
          { startDate: null },
          { startDate: { $lte: now } },
        ],
      },
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      },
    ],
  };

  if (placement && placement !== "both") {
    filter.placement = { $in: [placement, "both"] };
  }

  return AdModel.find(filter).sort("order -createdAt");
};

// An ad with its (active) products populated — for the shop campaign view and
// the admin edit form.
export const getAdWithProducts = async (id: string) => {
  const ad = await AdModel.findById(id).populate({
    path: "products",
    match: { status: "active" },
    select: PRODUCT_SELECT,
    populate: { path: "category", select: "name slug" },
  });
  if (!ad) throw new AppError("Ad not found", 404);
  return ad;
};
