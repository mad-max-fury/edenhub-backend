import {
  prop,
  modelOptions,
  Ref,
  getModelForClass,
} from "@typegoose/typegoose";
import { User } from "./user.model";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class Review {
  @prop({ required: true, ref: () => User })
  user: Ref<User>;

  @prop({ required: true })
  rating: number;

  @prop({ required: true })
  comment: string;

  @prop({ required: true })
  title: string;

  @prop({ required: true })
  verified: boolean;

  @prop({ required: true })
  createdAt: Date;

  @prop({ type: () => [String], default: [] })
  images: string[];

  @prop({ required: true, default: 0 })
  likes: number;

  @prop({ required: true, default: 0 })
  helpful: number;
}

const ReviewModel = getModelForClass(Review);

export default ReviewModel;
