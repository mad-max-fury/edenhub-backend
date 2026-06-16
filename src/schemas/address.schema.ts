import { boolean, object, string, TypeOf } from "zod";

export const createAddressSchema = object({
  body: object({
    fullName: string({ required_error: "Full name is required" }).trim().min(1),
    phone: string().trim().optional(),
    address: string({ required_error: "Address is required" }).trim().min(1),
    city: string({ required_error: "City is required" }).trim().min(1),
    state: string({ required_error: "State is required" }).trim().min(1),
    country: string().trim().default("Nigeria"),
    postalCode: string().trim().optional(),
    isDefault: boolean().optional(),
  }),
});

export const updateAddressSchema = object({
  body: object({
    fullName: string().trim().min(1).optional(),
    phone: string().trim().optional(),
    address: string().trim().min(1).optional(),
    city: string().trim().min(1).optional(),
    state: string().trim().min(1).optional(),
    country: string().trim().optional(),
    postalCode: string().trim().optional(),
    isDefault: boolean().optional(),
  }),
});

export type CreateAddressInput = TypeOf<typeof createAddressSchema>["body"];
