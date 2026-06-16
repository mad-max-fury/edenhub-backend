import { isValidObjectId } from "mongoose";
import { array, number, object, record, string, TypeOf, z } from "zod";
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from "../models/order.model";

const objectId = (label: string) =>
  string().refine((val) => isValidObjectId(val), {
    message: `Invalid ${label}`,
  });

const addressSchema = object({
  fullName: string({ required_error: "Recipient name is required" }).trim().min(1),
  phone: string().trim().optional(),
  email: string().email().optional(),
  address: string({ required_error: "Address is required" }).trim().min(1),
  city: string({ required_error: "City is required" }).trim().min(1),
  state: string({ required_error: "State is required" }).trim().min(1),
  country: string().trim().default("Nigeria"),
  postalCode: string().trim().optional(),
});

const orderItemSchema = object({
  product: objectId("product ID"),
  variantId: string().trim().optional(),
  quantity: number().int().min(1),
  attributes: record(z.any()).optional(),
});

const selectedCourierSchema = object({
  courierId: string(),
  courierName: string().optional(),
  serviceCode: string(),
  requestToken: string(),
  amount: number().min(0),
}).optional();

export const fetchRatesSchema = object({
  body: object({
    receiver: addressSchema,
    items: array(orderItemSchema).min(1, "At least one item is required"),
  }),
});

export const createOrderSchema = object({
  body: object({
    customer: objectId("customer ID"),
    items: array(orderItemSchema).min(1, "At least one item is required"),
    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional(),
    selectedCourier: selectedCourierSchema,
    shippingFee: number().min(0).optional(),
    discountTotal: number().min(0).optional(),
    taxAmount: number().min(0).optional(),
    customerNote: string().trim().optional(),
  }),
});

export const orderIdParamSchema = object({
  params: object({ id: objectId("order ID") }),
});

export const updateStatusSchema = object({
  params: object({ id: objectId("order ID") }),
  body: object({ status: z.nativeEnum(OrderStatus) }),
});

export const updatePaymentSchema = object({
  params: object({ id: objectId("order ID") }),
  body: object({ paymentStatus: z.nativeEnum(PaymentStatus) }),
});

export const updateFulfillmentSchema = object({
  params: object({ id: objectId("order ID") }),
  body: object({ fulfillmentStatus: z.nativeEnum(FulfillmentStatus) }),
});

export const shipOrderSchema = object({
  params: object({ id: objectId("order ID") }),
  body: object({
    serviceCode: string(),
    courierId: string(),
    requestToken: string().optional(),
  }),
});

export const refundOrderSchema = object({
  params: object({ id: objectId("order ID") }),
  body: object({ amount: number().min(0).optional() }),
});

export type CreateOrderInput = TypeOf<typeof createOrderSchema>["body"];
export type FetchRatesInput = TypeOf<typeof fetchRatesSchema>["body"];
