import {
  getModelForClass,
  prop,
  Ref,
  modelOptions,
  index,
  Severity,
} from "@typegoose/typegoose";
import { User } from "./user.model";
import { Order } from "./order.model";

export enum DisputeStatus {
  Open = "open",
  UnderReview = "under_review",
  Resolved = "resolved",
  Rejected = "rejected",
  Refunded = "refunded",
}

export enum DisputeType {
  Return = "return",
  Refund = "refund",
  Damaged = "damaged",
  WrongItem = "wrong_item",
  NotReceived = "not_received",
  Quality = "quality",
  Other = "other",
}

@modelOptions({ options: { allowMixed: Severity.ALLOW } })
export class DisputeMessage {
  @prop({ required: true, enum: ["customer", "admin"] })
  sender: string;

  @prop({ ref: () => User })
  senderId?: Ref<User>;

  @prop({ required: true, trim: true })
  body: string;

  @prop({ type: () => [String], default: [] })
  images: string[];

  @prop({ default: () => new Date() })
  createdAt: Date;
}

@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
@index({ customer: 1 })
@index({ order: 1 })
@index({ status: 1 })
export class Dispute {
  @prop({ ref: () => User, required: true })
  customer: Ref<User>;

  @prop({ ref: () => Order, required: true })
  order: Ref<Order>;

  @prop({ required: true, enum: DisputeType })
  type: DisputeType;

  @prop({ required: true, trim: true })
  reason: string;

  @prop({ trim: true })
  description?: string;

  @prop({ type: () => [String], default: [] })
  images: string[];

  @prop({ enum: DisputeStatus, default: DisputeStatus.Open })
  status: DisputeStatus;

  @prop()
  resolution?: string;

  @prop()
  refundAmount?: number;

  @prop()
  resolvedAt?: Date;

  @prop({ ref: () => User })
  resolvedBy?: Ref<User>;

  @prop({ type: () => [DisputeMessage], default: [] })
  messages: DisputeMessage[];

  createdAt: Date;
  updatedAt: Date;
}

export const DisputeModel = getModelForClass(Dispute);
