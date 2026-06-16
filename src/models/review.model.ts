import {
  prop,
  modelOptions,
  Ref,
  getModelForClass,
  index,
} from "@typegoose/typegoose";
import { User } from "./user.model";
import { Product } from "./product.model";

@index({ product: 1, createdAt: -1 })
@index({ user: 1, product: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
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

  @prop({ default: 0 })
  helpful: number;
}

const ReviewModel = getModelForClass(Review);

export default ReviewModel;
