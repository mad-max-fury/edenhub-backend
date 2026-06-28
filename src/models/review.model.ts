import {
  prop,
  modelOptions,
  Ref,
  getModelForClass,
  index,
  Severity,
} from "@typegoose/typegoose";
import { User } from "./user.model";
import { Product } from "./product.model";

@modelOptions({ options: { allowMixed: Severity.ALLOW } })
export class ReviewReply {
  @prop({ ref: () => User, required: true })
  user: Ref<User>;

  @prop({ required: true, trim: true })
  comment: string;

  @prop({ default: false })
  isAdmin: boolean;

  @prop({ default: () => new Date() })
  createdAt: Date;
}

@index({ product: 1, createdAt: -1 })
@index({ user: 1, product: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class Review {
  @prop({ required: true, ref: () => Product })
  product: Ref<Product>;

  @prop({ required: true, ref: () => User })
  user: Ref<User>;

  @prop({ required: true, min: 1, max: 5 })
  rating: number;

  @prop({ required: true })
  title: string;

  @prop({ required: true })
  comment: string;

  // True when the reviewer is a verified buyer (delivered order).
  @prop({ default: true })
  verified: boolean;

  @prop({ type: () => [String], default: [] })
  images: string[];

  @prop({ default: 0 })
  likes: number;

  @prop({ type: () => [String], default: [] })
  likedBy: string[];

  @prop({ default: 0 })
  helpful: number;

  @prop({ type: () => [ReviewReply], default: [] })
  replies: ReviewReply[];
}

const ReviewModel = getModelForClass(Review);

export default ReviewModel;
