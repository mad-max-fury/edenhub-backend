import {
  prop,
  modelOptions,
  Ref,
  getModelForClass,
  index,
} from "@typegoose/typegoose";
import { Product } from "./product.model";

export enum AdPlacement {
  Hero = "hero",
  Shop = "shop",
  Both = "both",
}

@index({ isActive: 1, placement: 1, order: 1 })
@modelOptions({ schemaOptions: { timestamps: true } })
export class Ad {
  @prop({ required: true, trim: true })
  title: string;

  @prop({ trim: true })
  eyebrow?: string;

  @prop({ trim: true })
  subtitle?: string;

  // Longer copy shown on the shop campaign view.
  @prop({ trim: true })
  description?: string;

  @prop()
  image?: string;

  @prop({ trim: true })
  ctaText?: string;

  @prop({ trim: true })
  ctaLink?: string;

  @prop({ enum: AdPlacement, default: AdPlacement.Hero })
  placement: AdPlacement;

  // Products promoted by this ad (shown on its shop campaign view).
  @prop({ ref: () => Product, default: [] })
  products: Ref<Product>[];

  @prop({ default: true })
  isActive: boolean;

  @prop({ default: 0 })
  order: number;

  @prop()
  startDate?: Date;

  @prop()
  endDate?: Date;
}

const AdModel = getModelForClass(Ad);

export default AdModel;
