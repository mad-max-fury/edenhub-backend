import { isValidObjectId } from "mongoose";
import { array, boolean, number, object, string, TypeOf, z } from "zod";
import { AttributeInputType } from "../models/category.model";

const objectId = (label: string) =>
  string().refine((val) => isValidObjectId(val), {
    message: `Invalid ${label}`,
  });

const attributeOptionSchema = object({
  label: string({ required_error: "Option label is required" }).trim().min(1),
  value: string({ required_error: "Option value is required" }).trim().min(1),
});

export const categoryAttributeSchema = object({
  name: string({ required_error: "Attribute name is required" }).trim().min(1),
  inputType: z.nativeEnum(AttributeInputType).default(AttributeInputType.Text),
  isRequired: boolean().default(false),
  order: number().default(0),
  options: array(attributeOptionSchema).default([]),
}).superRefine((data, ctx) => {
  const needsOptions =
    data.inputType === AttributeInputType.Select ||
    data.inputType === AttributeInputType.Radio ||
    data.inputType === AttributeInputType.Checkbox;

  if (needsOptions && data.options.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["options"],
      message: `'${data.inputType}' attributes require at least one option`,
    });
  }
});

export const createCategorySchema = object({
  body: object({
    name: string({ required_error: "Category name is required" }).trim().min(1),
    slug: string().trim().optional(),
    description: string().trim().optional(),
    parent: objectId("parent category ID").nullable().optional(),
    image: string().trim().optional(),
    isActive: boolean().default(true),
    attributes: array(categoryAttributeSchema).default([]),
  }),
});

// Recursive nested-tree node used for bulk JSON import. Hierarchy is expressed
// via `subcategories` rather than parent IDs.
const bulkCategoryNode: z.ZodTypeAny = z.lazy(() =>
  object({
    name: string({ required_error: "Category name is required" }).trim().min(1),
    slug: string().trim().optional(),
    description: string().trim().optional(),
    image: string().trim().optional(),
    isActive: boolean().default(true),
    attributes: array(categoryAttributeSchema).default([]),
    subcategories: array(bulkCategoryNode).default([]),
  }),
);

export const bulkCreateCategorySchema = object({
  body: object({
    categories: array(bulkCategoryNode).min(
      1,
      "Provide at least one category to import",
    ),
  }),
});

export const updateCategorySchema = object({
  params: object({
    id: objectId("category ID"),
  }),
  body: object({
    name: string().trim().min(1).optional(),
    slug: string().trim().optional(),
    description: string().trim().optional(),
    parent: objectId("parent category ID").nullable().optional(),
    image: string().trim().optional(),
    isActive: boolean().optional(),
    attributes: array(categoryAttributeSchema).optional(),
  }),
});

export const categoryIdParamSchema = object({
  params: object({
    id: objectId("category ID"),
  }),
});

export const addAttributeSchema = object({
  params: object({
    id: objectId("category ID"),
  }),
  body: categoryAttributeSchema,
});

export const updateAttributeSchema = object({
  params: object({
    id: objectId("category ID"),
    attributeId: objectId("attribute ID"),
  }),
  body: object({
    name: string().trim().min(1).optional(),
    inputType: z.nativeEnum(AttributeInputType).optional(),
    isRequired: boolean().optional(),
    order: number().optional(),
    options: array(attributeOptionSchema).optional(),
  }),
});

export type CreateCategoryInput = TypeOf<typeof createCategorySchema>["body"];
export type UpdateCategoryInput = TypeOf<typeof updateCategorySchema>["body"];
export type CategoryAttributeInput = TypeOf<typeof categoryAttributeSchema>;
