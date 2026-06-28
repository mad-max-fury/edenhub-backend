import { Types } from "mongoose";
import ReviewModel from "../models/review.model";
import ProductModel from "../models/product.model";
import OrderModel from "../models/order.model";
import AppError from "../errors/appError";
import { IPaginationQuery } from "../utils/pagination.utils";
import { CreateReviewInput } from "../schemas/review.schema";
import { createAdminNotification } from "./notification.service";
import { NotificationType } from "../models/notification.model";

// Recompute a product's averageRating + totalReviews from its reviews.
const recomputeProductRating = async (productId: string) => {
  const [agg] = await ReviewModel.aggregate([
    { $match: { product: new Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  await ProductModel.findByIdAndUpdate(productId, {
    averageRating: agg ? Math.round(agg.averageRating * 10) / 10 : 0,
    totalReviews: agg ? agg.totalReviews : 0,
  });
};

// A user may review a product only if they have a delivered order with it.
const hasDeliveredProduct = async (userId: string, productId: string) => {
  return OrderModel.exists({
    customer: userId,
    fulfillmentStatus: "delivered",
    "items.product": productId,
  });
};

export const createReview = async (
  userId: string,
  data: CreateReviewInput,
) => {
  const eligible = await hasDeliveredProduct(userId, data.product);
  if (!eligible) {
    throw new AppError(
      "You can only review products from a delivered order",
      403,
    );
  }

  const already = await ReviewModel.exists({
    user: userId,
    product: data.product,
  });
  if (already) {
    throw new AppError("You have already reviewed this product", 409);
  }

  const review = await ReviewModel.create({
    ...data,
    user: userId,
    verified: true,
  });

  await recomputeProductRating(data.product);

  const product = await ProductModel.findById(data.product).select("name");
  createAdminNotification({
    type: NotificationType.Review,
    title: "New product review",
    message: `${data.rating}★ on ${product?.name ?? "a product"}`,
    link: `/admin/products/${data.product}`,
  });

  return review.populate("user", "firstName lastName profilePicture");
};

export const getProductReviews = async (
  productId: string,
  query: IPaginationQuery,
  userId?: string,
) => {
  const { pageNumber, pageSize } = query;
  const skip = (pageNumber - 1) * pageSize;

  const [reviews, totalCount] = await Promise.all([
    ReviewModel.find({ product: productId })
      .populate("user", "firstName lastName profilePicture")
      .populate("replies.user", "firstName lastName")
      .sort("-createdAt")
      .skip(skip)
      .limit(pageSize),
    ReviewModel.countDocuments({ product: productId }),
  ]);

  let canReview = false;
  if (userId) {
    const hasDelivered = await OrderModel.countDocuments({
      customer: userId,
      "items.product": productId,
      fulfillmentStatus: "delivered",
    });
    const alreadyReviewed = await ReviewModel.countDocuments({
      user: userId,
      product: productId,
    });
    canReview = hasDelivered > 0 && alreadyReviewed === 0;
  }

  return { reviews, totalCount, canReview };
};

// Split the user's reviewable products into pending (delivered, not reviewed)
// and reviewed.
export const getMyReviews = async (userId: string) => {
  const reviewed = await ReviewModel.find({ user: userId })
    .populate("product", "name coverImage")
    .sort("-createdAt");

  const reviewedProductIds = new Set(
    reviewed.map((r) => String(r.product?._id ?? r.product)),
  );

  // Distinct delivered products for this user.
  const deliveredOrders = await OrderModel.find({
    customer: userId,
    fulfillmentStatus: "delivered",
  })
    .select("orderNumber items updatedAt")
    .sort("-updatedAt");

  const pendingMap = new Map<string, any>();
  deliveredOrders.forEach((order: any) => {
    order.items.forEach((item: any) => {
      const pid = String(item.product);
      if (!pid || reviewedProductIds.has(pid) || pendingMap.has(pid)) return;
      pendingMap.set(pid, {
        product: pid,
        name: item.name,
        image: item.image,
        orderNumber: order.orderNumber,
        deliveredAt: order.updatedAt,
      });
    });
  });

  return { pending: Array.from(pendingMap.values()), reviewed };
};

export const addReply = async (
  reviewId: string,
  userId: string,
  comment: string,
  isAdmin: boolean,
) => {
  const review = await ReviewModel.findById(reviewId);
  if (!review) throw new AppError("Review not found", 404);

  review.replies.push({ user: userId as any, comment, isAdmin, createdAt: new Date() });
  await review.save();
  return review.populate([
    { path: "user", select: "firstName lastName profilePicture" },
    { path: "replies.user", select: "firstName lastName" },
  ]);
};

export const toggleLike = async (reviewId: string, userId: string) => {
  const review = await ReviewModel.findById(reviewId);
  if (!review) throw new AppError("Review not found", 404);

  const idx = review.likedBy.indexOf(userId);
  if (idx >= 0) {
    review.likedBy.splice(idx, 1);
    review.likes = Math.max(0, review.likes - 1);
  } else {
    review.likedBy.push(userId);
    review.likes += 1;
  }
  await review.save();
  return { likes: review.likes, liked: idx < 0 };
};
