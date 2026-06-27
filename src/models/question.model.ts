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

@modelOptions({ options: { allowMixed: Severity.ALLOW } })
export class QuestionAnswer {
  @prop({ ref: () => User })
  user?: Ref<User>;

  @prop({ required: true, trim: true })
  body: string;

  @prop({ default: false })
  isAdmin: boolean;

  @prop({ default: () => new Date() })
  createdAt: Date;
}

@index({ product: 1, createdAt: -1 })
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
export class Question {
  @prop({ ref: () => Product, required: true })
  product: Ref<Product>;

  @prop({ ref: () => User, required: true })
  user: Ref<User>;

  @prop({ required: true, trim: true })
  question: string;

  @prop({ type: () => [QuestionAnswer], default: [] })
  answers: QuestionAnswer[];

  @prop({ default: 0 })
  votes: number;

  @prop({ type: () => [String], default: [] })
  votedBy: string[];

  createdAt: Date;
}

export const QuestionModel = getModelForClass(Question);
