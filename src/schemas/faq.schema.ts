import { isValidObjectId } from "mongoose";
import { boolean, number, object, string, TypeOf } from "zod";

const objectId = (label: string) =>
  string().refine((val) => isValidObjectId(val), {
    message: `Invalid ${label}`,
  });

export const createFaqSchema = object({
  body: object({
    question: string({ required_error: "Question is required" }).trim().min(1),
    answer: string({ required_error: "Answer is required" }).trim().min(1),
    category: string().trim().default("general"),
    order: number().default(0),
    isActive: boolean().default(true),
  }),
});

export const updateFaqSchema = object({
  params: object({ id: objectId("FAQ ID") }),
  body: object({
    question: string().trim().min(1).optional(),
    answer: string().trim().min(1).optional(),
    category: string().trim().optional(),
    order: number().optional(),
    isActive: boolean().optional(),
  }),
});

export const faqIdParamSchema = object({
  params: object({ id: objectId("FAQ ID") }),
});

export type CreateFaqInput = TypeOf<typeof createFaqSchema>["body"];
export type UpdateFaqInput = TypeOf<typeof updateFaqSchema>["body"];
