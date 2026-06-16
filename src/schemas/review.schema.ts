import { isValidObjectId } from "mongoose";
import { array, number, object, string, TypeOf } from "zod";

const objectId = (label: string) =>
  string().refine((val) => isValidObjectId(val), {
    message: `Invalid ${label}`,
  });

export const createReviewSchema = object({
  body: object({
    product: objectId("product ID"),
    rating: number().int().min(1).max(5),
    title: string({ required_error: "Title is required" }).trim().min(1),
    comment: string({ required_error: "Comment is required" }).trim().min(1),
    images: array(string()).default([]),
  }),
});

export type CreateReviewInput = TypeOf<typeof createReviewSchema>["body"];
