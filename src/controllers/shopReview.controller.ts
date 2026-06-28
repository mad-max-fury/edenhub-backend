import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as shopReviewService from "../services/shopReview.service";
import {
  getPaginationMetadata,
  IPaginationQuery,
} from "../utils/pagination.utils";

export const createShopReviewHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    const review = await shopReviewService.createShopReview({
      ...req.body,
      user: userId,
    });
    res.status(201).json({
      status: "success",
      message: "Thanks! Your review will appear once approved.",
      data: review,
    });
  },
);

export const adminCreateShopReviewHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    const review = await shopReviewService.adminCreateShopReview({
      ...req.body,
      user: userId,
    });
    res.status(201).json({
      status: "success",
      message: "Review created and published",
      data: review,
    });
  },
);

export const getApprovedReviewsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 12;
    const reviews = await shopReviewService.getApprovedReviews(limit);
    res.status(200).json({
      status: "success",
      message: "Reviews retrieved successfully",
      data: reviews,
    });
  },
);

export const getAllShopReviewsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query: IPaginationQuery & { status?: string } = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      searchTerm: req.query.searchTerm as string,
      status: req.query.status as string,
    };

    const { reviews, totalCount } =
      await shopReviewService.getAllShopReviews(query);
    const metadata = getPaginationMetadata(
      totalCount,
      query.pageNumber,
      query.pageSize,
    );

    res.status(200).json({
      status: "success",
      message: "Reviews retrieved successfully",
      data: { data: reviews, metadata },
    });
  },
);

export const updateShopReviewStatusHandler = catchAsync(
  async (req: Request, res: Response) => {
    const review = await shopReviewService.updateShopReviewStatus(
      req.params.id,
      req.body.status,
    );
    res.status(200).json({
      status: "success",
      message: "Review updated successfully",
      data: review,
    });
  },
);

export const deleteShopReviewHandler = catchAsync(
  async (req: Request, res: Response) => {
    await shopReviewService.deleteShopReview(req.params.id);
    res.status(204).json({ status: "success", data: null });
  },
);

export const getShopReviewStatsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const stats = await shopReviewService.getShopReviewStats();
    res.status(200).json({
      status: "success",
      message: "Stats retrieved successfully",
      data: stats,
    });
  },
);
