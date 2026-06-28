import {
  prop,
  modelOptions,
  getModelForClass,
  index,
} from "@typegoose/typegoose";

@index({ isActive: 1, category: 1, order: 1 })
@modelOptions({ schemaOptions: { timestamps: true } })
export class Faq {
  @prop({ required: true, trim: true })
  question: string;

  @prop({ required: true })
  answer: string;

  // Free-form grouping: orders | payments | repairs | general, etc.
  @prop({ trim: true, default: "general" })
  category: string;

  @prop({ default: 0 })
  order: number;

  @prop({ default: true })
  isActive: boolean;
}

const FaqModel = getModelForClass(Faq);

export default FaqModel;
