import { isValidObjectId } from "mongoose";
import {
  array,
  boolean,
  number,
  object,
  record,
  string,
  TypeOf,
  z,
} from "zod";
import { ProductStatus, ProductAudience } from "../models/product.model";

const objectId = (label: string) =>
  string().refine((val) => isValidObjectId(val), {
    message: `Invalid ${label}`,
  });

const discountSchema = object({
  percentage: number().min(0).max(100).optional(),
  price: number().min(0).optional(),
  startDate: string().optional(),
  endDate: string().optional(),
  promotionName: string().optional(),
}).optional();

const engravingSchema = object({
  available: boolean().default(false),
  fee: number().min(0).default(0),
  maxCharacters: number().min(1).default(20),
  maxLines: number().min(1).default(1),
  fonts: array(string()).default([]),
}).optional();

export const variantSchema = object({
  name: string({ required_error: "Variant name is required" }).trim().min(1),
  sku: string().trim().optional(),
  basePrice: number({ required_error: "Variant base price is required" }).min(0),
  discount: discountSchema,
  quantity: number().min(0).default(0),
  attributes: record(z.any()).default({}),
  tags: array(string()).default([]),
  images: array(string()).default([]),
  isActive: boolean().default(true),
});

const productBody = {
  name: string({ required_error: "Product name is required" }).trim().min(1),
  description: string({ required_error: "Description is required" })
    .trim()
    .min(1),
  brand: string().trim().optional(),
  category: objectId("category ID"),
  basePrice: number({ required_error: "Base price is required" }).min(0),
  discount: discountSchema,
  quantity: number().min(0).default(0),
  attributes: record(z.any()).default({}),
  tags: array(string()).default([]),
  coverImage: string().trim().optional(),
  images: array(string()).default([]),
  weight: string().trim().optional(),
  isReturnable: boolean().default(false),
  returnableDays: number().min(0).optional(),
  hasWarranty: boolean().default(false),
  warrantyYears: number().min(0).optional(),
  engraving: engravingSchema,
  variants: array(variantSchema).default([]),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.Active),
  audience: z.nativeEnum(ProductAudience).default(ProductAudience.Unisex),
  variationGroup: string().trim().optional(),
  variationLabel: string().trim().optional(),
  variationValue: string().trim().optional(),
};

export const createProductSchema = object({
  body: object(productBody),
});

export const updateProductSchema = object({
  params: object({ id: objectId("product ID") }),
  body: object({
    name: string().trim().min(1).optional(),
    description: string().trim().min(1).optional(),
    brand: string().trim().optional(),
    category: objectId("category ID").optional(),
    basePrice: number().min(0).optional(),
    discount: discountSchema,
    quantity: number().min(0).optional(),
    attributes: record(z.any()).optional(),
    tags: array(string()).optional(),
    coverImage: string().trim().optional(),
    images: array(string()).optional(),
    weight: string().trim().optional(),
    isReturnable: boolean().optional(),
    returnableDays: number().min(0).optional(),
    hasWarranty: boolean().optional(),
    warrantyYears: number().min(0).optional(),
    engraving: engravingSchema,
    variants: array(variantSchema).optional(),
    status: z.nativeEnum(ProductStatus).optional(),
    audience: z.nativeEnum(ProductAudience).optional(),
    variationGroup: string().trim().optional(),
    variationLabel: string().trim().optional(),
    variationValue: string().trim().optional(),
  }),
});

// Bulk import accepts category as an id OR a slug, so CSV/JSON authors don't
// need to know Mongo ObjectIds.
const bulkProductInput = object({
  name: string({ required_error: "Product name is required" }).trim().min(1),
  description: string({ required_error: "Description is required" })
    .trim()
    .min(1),
  brand: string().trim().optional(),
  category: string({ required_error: "Category (id or slug) is required" })
    .trim()
    .min(1),
  basePrice: number({ required_error: "Base price is required" }).min(0),
  discount: discountSchema,
  quantity: number().min(0).default(0),
  attributes: record(z.any()).default({}),
  tags: array(string()).default([]),
  coverImage: string().trim().optional(),
  images: array(string()).default([]),
  weight: string().trim().optional(),
  isReturnable: boolean().default(false),
  returnableDays: number().min(0).optional(),
  hasWarranty: boolean().default(false),
  warrantyYears: number().min(0).optional(),
  engraving: engravingSchema,
  variants: array(variantSchema).default([]),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.Active),
  audience: z.nativeEnum(ProductAudience).default(ProductAudience.Unisex),
});

export const bulkCreateProductSchema = object({
  body: object({
    products: array(bulkProductInput).min(
      1,
      "Provide at least one product to import",
    ),
  }),
});

export const productIdParamSchema = object({
  params: object({ id: objectId("product ID") }),
});

export const updateStatusSchema = object({
  params: object({ id: objectId("product ID") }),
  body: object({ status: z.nativeEnum(ProductStatus) }),
});

export const addVariantSchema = object({
  params: object({ id: objectId("product ID") }),
  body: variantSchema,
});

export const updateVariantSchema = object({
  params: object({
    id: objectId("product ID"),
    variantId: objectId("variant ID"),
  }),
  body: object({
    name: string().trim().min(1).optional(),
    sku: string().trim().optional(),
    basePrice: number().min(0).optional(),
    discount: discountSchema,
    quantity: number().min(0).optional(),
    attributes: record(z.any()).optional(),
    tags: array(string()).optional(),
    images: array(string()).optional(),
    isActive: boolean().optional(),
  }),
});

export type CreateProductInput = TypeOf<typeof createProductSchema>["body"];
export type UpdateProductInput = TypeOf<typeof updateProductSchema>["body"];
export type VariantInput = TypeOf<typeof variantSchema>;
export type BulkProductInput = TypeOf<typeof bulkProductInput>;
