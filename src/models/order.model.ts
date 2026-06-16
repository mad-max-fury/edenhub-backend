import {
  getModelForClass,
  prop,
  Ref,
  modelOptions,
  index,
  Severity,
} from "@typegoose/typegoose";
import { User } from "./user.model";
import { Product } from "./product.model";

export enum OrderStatus {
  Pending = "pending",
  Processing = "processing",
  Completed = "completed",
  Cancelled = "cancelled",
}

export enum PaymentStatus {
  Pending = "pending",
  Paid = "paid",
  Failed = "failed",
  Refunded = "refunded",
}

export enum FulfillmentStatus {
  Unfulfilled = "unfulfilled",
  Fulfilled = "fulfilled",
  Shipped = "shipped",
  Delivered = "delivered",
  Returned = "returned",
}

@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})

// Snapshot of a purchased product/variant at the time of order.
export class OrderItem {
  @prop({ ref: () => Product })
  product?: Ref<Product>;

  @prop()
  variantId?: string;

  @prop({ required: true })
  name: string;

  @prop()
  sku?: string;

  @prop()
  image?: string;

  @prop({ required: true, default: 0 })
  unitPrice: number;

  @prop({ required: true, default: 1 })
  quantity: number;

  @prop({ required: true, default: 0 })
  lineTotal: number;

  @prop({ type: () => Object, default: {} })
  attributes: Record<string, unknown>;
}

export class Address {
  @prop({ required: true })
  fullName: string;

  @prop()
  phone?: string;

  @prop()
  email?: string;

  @prop({ required: true })
  address: string;

  @prop({ required: true })
  city: string;

  @prop({ required: true })
  state: string;

  @prop({ default: "Nigeria" })
  country: string;

  @prop()
  postalCode?: string;

  // Shipbubble validated address code (set when rates are fetched).
  @prop()
  addressCode?: string;
}

// Logistics details populated through the Shipbubble flow.
export class Shipment {
  @prop()
  courier?: string;

  @prop()
  courierId?: string;

  @prop()
  serviceCode?: string;

  // Shipbubble rate token from fetch_rates, needed to book the label.
  @prop()
  requestToken?: string;

  @prop()
  shipbubbleOrderId?: string;

  @prop()
  trackingNumber?: string;

  @prop()
  trackingUrl?: string;

  @prop()
  labelUrl?: string;

  @prop()
  shippedAt?: Date;

  @prop()
  deliveredAt?: Date;
}

export class TimelineEntry {
  @prop({ required: true })
  type: string; // status | payment | fulfillment | note

  @prop({ required: true })
  message: string;

  @prop({ ref: () => User })
  by?: Ref<User>;

  @prop({ default: () => new Date() })
  at: Date;
}

@index({ orderNumber: 1 }, { unique: true })
@index({ customer: 1 })
@index({ status: 1 })
@index({ paymentStatus: 1 })
@index({ fulfillmentStatus: 1 })
@index({ createdAt: -1 })
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
export class Order {
  @prop({ required: true })
  orderNumber: string;

  @prop({ ref: () => User, required: true })
  customer: Ref<User>;

  @prop({ type: () => [OrderItem], default: [], _id: true })
  items: OrderItem[];

  // ── Money (NGN) ────────────────────────────────────────────────────────────
  @prop({ required: true, default: 0 })
  subtotal: number;

  @prop({ default: 0 })
  discountTotal: number;

  @prop({ default: 0 })
  shippingFee: number;

  @prop({ default: 0 })
  taxAmount: number;

  @prop({ required: true, default: 0 })
  grandTotal: number;

  @prop({ default: "NGN" })
  currency: string;

  // ── Status ───────────────────────────────────────────────────────────────
  @prop({ required: true, enum: OrderStatus, default: OrderStatus.Pending })
  status: OrderStatus;

  @prop({
    required: true,
    enum: PaymentStatus,
    default: PaymentStatus.Pending,
  })
  paymentStatus: PaymentStatus;

  @prop({
    required: true,
    enum: FulfillmentStatus,
    default: FulfillmentStatus.Unfulfilled,
  })
  fulfillmentStatus: FulfillmentStatus;

  // ── Payment (Paystack) ─────────────────────────────────────────────────────
  @prop({ default: "paystack" })
  paymentProvider: string;

  @prop()
  paymentReference?: string;

  @prop()
  paymentAuthorizationUrl?: string;

  @prop()
  paidAt?: Date;

  // ── Shipping / addresses ───────────────────────────────────────────────────
  @prop({ type: () => Address, _id: false })
  shippingAddress?: Address;

  @prop({ type: () => Address, _id: false })
  billingAddress?: Address;

  @prop({ type: () => Shipment, default: {}, _id: false })
  shipment: Shipment;

  // ── Misc ───────────────────────────────────────────────────────────────────
  @prop()
  customerNote?: string;

  @prop()
  internalNote?: string;

  @prop({ type: () => [TimelineEntry], default: [], _id: false })
  timeline: TimelineEntry[];
}

const OrderModel = getModelForClass(Order);
export default OrderModel;
