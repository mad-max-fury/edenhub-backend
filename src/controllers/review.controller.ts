import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import catchAsync from "../utils/error.utils";
import * as reviewService from "../services/review.service";
import { findOneUser } from "../services/user.service";
import { getConfig } from "../config";
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

    let userId: string | undefined;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const decoded = jwt.verify(authHeader.split(" ")[1], getConfig("jwtSecret")) as { id: string };
        userId = decoded.id;
      }
    } catch {}

    const { reviews, totalCount, canReview } = await reviewService.getProductReviews(
      req.params.productId,
      query,
      userId,
    );

    const metadata = getPaginationMetadata(
      totalCount,
      query.pageNumber,
      query.pageSize,
    );

    res.status(200).json({
      status: "success",
      message: "Reviews retrieved successfully",
      data: { data: reviews, metadata, canReview },
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

export const replyHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = await findOneUser({ _id: req.user!.id });
    const isAdmin = !!user?.staffId;
    const result = await reviewService.addReply(
      req.params.id,
      req.user!.id,
      req.body.comment,
      isAdmin,
    );
    res.status(200).json({ status: "success", data: result });
  },
);

export const toggleLikeHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await reviewService.toggleLike(req.params.id, req.user!.id);
    res.status(200).json({ status: "success", data: result });
  },
);
