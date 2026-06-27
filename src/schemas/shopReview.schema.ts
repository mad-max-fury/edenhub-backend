import { isValidObjectId } from "mongoose";
import { number, object, string, TypeOf, z } from "zod";
import { ShopReviewStatus } from "../models/shopReview.model";

const objectId = (label: string) =>
  string().refine((val) => isValidObjectId(val), {
    message: `Invalid ${label}`,
  });

export const createShopReviewSchema = object({
  body: object({
    name: string({ required_error: "Name is required" }).trim().min(1),
    email: string().trim().email("Invalid email").optional(),
    title: string().trim().optional(),
    comment: string({ required_error: "Comment is required" }).trim().min(3),
    rating: number().min(1).max(5).default(5),
    image: string().trim().optional(),
  }),
});

export const updateShopReviewStatusSchema = object({
  params: object({ id: objectId("review ID") }),
  body: object({ status: z.nativeEnum(ShopReviewStatus) }),
});

export const shopReviewIdParamSchema = object({
  params: object({ id: objectId("review ID") }),
});

export type CreateShopReviewInput = TypeOf<
  typeof createShopReviewSchema
>["body"];
