import { isValidObjectId } from "mongoose";
import { array, boolean, number, object, string, TypeOf, z } from "zod";
import { AdPlacement } from "../models/ad.model";

const objectId = (label: string) =>
  string().refine((val) => isValidObjectId(val), {
    message: `Invalid ${label}`,
  });

const adBody = {
  title: string({ required_error: "Title is required" }).trim().min(1),
  eyebrow: string().trim().optional(),
  subtitle: string().trim().optional(),
  description: string().trim().optional(),
  image: string().trim().optional(),
  ctaText: string().trim().optional(),
  ctaLink: string().trim().optional(),
  placement: z.nativeEnum(AdPlacement).default(AdPlacement.Hero),
  products: array(objectId("product ID")).default([]),
  isActive: boolean().default(true),
  order: number().default(0),
  startDate: string().optional(),
  endDate: string().optional(),
};

export const createAdSchema = object({ body: object(adBody) });

export const updateAdSchema = object({
  params: object({ id: objectId("ad ID") }),
  body: object({
    title: string().trim().min(1).optional(),
    eyebrow: string().trim().optional(),
    subtitle: string().trim().optional(),
    description: string().trim().optional(),
    image: string().trim().optional(),
    ctaText: string().trim().optional(),
    ctaLink: string().trim().optional(),
    placement: z.nativeEnum(AdPlacement).optional(),
    products: array(objectId("product ID")).optional(),
    isActive: boolean().optional(),
    order: number().optional(),
    startDate: string().optional(),
    endDate: string().optional(),
  }),
});

export const adIdParamSchema = object({
  params: object({ id: objectId("ad ID") }),
});

export type CreateAdInput = TypeOf<typeof createAdSchema>["body"];
export type UpdateAdInput = TypeOf<typeof updateAdSchema>["body"];
