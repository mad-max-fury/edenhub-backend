import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as reviewService from "../services/review.service";
import {
  getPaginationMetadata,
  IPaginationQuery,
} from "../utils/pagination.utils";

export const createReviewHandler = catchAsync(
  async (req: Request, res: Response) => {
    const review = await reviewService.createReview(req.user!.id, req.body);
    res.status(201).json({
      status: "success",
      message: "Review submitted successfully",
      data: review,
    });
  },
);

export const getProductReviewsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
    };

    const { reviews, totalCount } = await reviewService.getProductReviews(
      req.params.productId,
      query,
    );

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

export const getMyReviewsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const data = await reviewService.getMyReviews(req.user!.id);
    res.status(200).json({
      status: "success",
      message: "Reviews retrieved successfully",
      data,
    });
  },
);
