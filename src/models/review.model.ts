import {
  prop,
  modelOptions,
  Ref,
  getModelForClass,
} from "@typegoose/typegoose";
import { User } from "./user.model"; // Ensure this import points to the correct User model file

// Define the Review class
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class Review {
  @prop({ required: true, ref: () => User }) // Ensure ref points to the correct User class
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

// Create the Mongoose model for Review
const ReviewModel = getModelForClass(Review);

export default ReviewModel;
