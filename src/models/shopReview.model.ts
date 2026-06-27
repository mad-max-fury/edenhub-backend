import {
  prop,
  modelOptions,
  Ref,
  getModelForClass,
  index,
} from "@typegoose/typegoose";
import { User } from "./user.model";

export enum ShopReviewStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
}

// A site-wide review / testimonial (distinct from per-product reviews).
@index({ status: 1, createdAt: -1 })
@modelOptions({ schemaOptions: { timestamps: true } })
export class ShopReview {
  @prop({ ref: () => User })
  user?: Ref<User>;

  @prop({ required: true, trim: true })
  name: string;

  @prop({ trim: true })
  email?: string;

  @prop({ trim: true })
  title?: string;

  @prop({ required: true })
  comment: string;

  @prop({ required: true, min: 1, max: 5, default: 5 })
  rating: number;

  @prop()
  image?: string;

  @prop({ enum: ShopReviewStatus, default: ShopReviewStatus.Pending })
  status: ShopReviewStatus;
}

const ShopReviewModel = getModelForClass(ShopReview);

export default ShopReviewModel;
