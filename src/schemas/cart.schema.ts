import { isValidObjectId } from "mongoose";
import { number, object, string, TypeOf } from "zod";

const objectId = (label: string) =>
  string().refine((val) => isValidObjectId(val), {
    message: `Invalid ${label}`,
  });

export const addCartItemSchema = object({
  body: object({
    product: objectId("product ID"),
    variantId: string().trim().optional(),
    quantity: number().int().min(1).default(1),
  }),
});

export const updateCartItemSchema = object({
  params: object({ itemId: objectId("cart item ID") }),
  body: object({ quantity: number().int() }),
});

export const cartItemParamSchema = object({
  params: object({ itemId: objectId("cart item ID") }),
});

export type AddCartItemInput = TypeOf<typeof addCartItemSchema>["body"];
