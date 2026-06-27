import { boolean, object, string, TypeOf } from "zod";

export const createAddressSchema = object({
  body: object({
    firstName: string({ required_error: "First name is required" }).trim().min(1),
    lastName: string({ required_error: "Last name is required" }).trim().min(1),
    fullName: string().trim().optional(),
    phone: string({ required_error: "Phone is required" }).trim().min(1),
    additionalPhone: string().trim().optional(),
    address: string({ required_error: "Address is required" }).trim().min(1),
    landmark: string().trim().optional(),
    city: string({ required_error: "City is required" }).trim().min(1),
    state: string({ required_error: "State is required" }).trim().min(1),
    country: string().trim().default("Nigeria"),
    postalCode: string().trim().optional(),
    email: string().email().optional(),
    addressCode: string().trim().optional(),
    isDefault: boolean().optional(),
  }),
});

export const updateAddressSchema = object({
  body: object({
    firstName: string().trim().min(1).optional(),
    lastName: string().trim().min(1).optional(),
    fullName: string().trim().optional(),
    phone: string().trim().optional(),
    additionalPhone: string().trim().optional(),
    email: string().email().optional(),
    address: string().trim().min(1).optional(),
    landmark: string().trim().optional(),
    city: string().trim().min(1).optional(),
    state: string().trim().min(1).optional(),
    country: string().trim().optional(),
    postalCode: string().trim().optional(),
    addressCode: string().trim().optional(),
    isDefault: boolean().optional(),
  }),
});

export type CreateAddressInput = TypeOf<typeof createAddressSchema>["body"];
