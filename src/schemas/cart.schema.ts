import { isValidObjectId } from "mongoose";
import { array, number, object, string, TypeOf } from "zod";

const objectId = (label: string) =>
  string().refine((val) => isValidObjectId(val), {
    message: `Invalid ${label}`,
  });

const engravingBody = {
  font: string().trim().optional(),
  lines: array(string()).optional(),
};

export const addCartItemSchema = object({
  body: object({
    product: objectId("product ID"),
    variantId: string().trim().optional(),
    quantity: number().int().min(1).default(1),
    engraving: object(engravingBody).optional(),
  }),
});

export const setEngravingSchema = object({
  params: object({ itemId: objectId("cart item ID") }),
  body: object(engravingBody),
});

export const updateCartItemSchema = object({
  params: object({ itemId: objectId("cart item ID") }),
  body: object({ quantity: number().int() }),
});

export const cartItemParamSchema = object({
  params: object({ itemId: objectId("cart item ID") }),
});

export type AddCartItemInput = TypeOf<typeof addCartItemSchema>["body"];
