import {
  prop,
  modelOptions,
  getModelForClass,
  Severity,
  Ref,
  index,
  DocumentType,
  pre,
} from "@typegoose/typegoose";
import { nanoid } from "nanoid";
import { Category } from "./category.model";

export enum ProductStatus {
  Active = "active",
  Archived = "archived",
  Drafted = "drafted",
}

export enum ProductAudience {
  Men = "men",
  Women = "women",
  Unisex = "unisex",
}

// Embedded discount shared by products and their variants.
export class Discount {
  @prop({ default: 0, min: 0, max: 100 })
  percentage: number;

  @prop({ default: 0, min: 0 })
  price: number;

  @prop()
  startDate?: Date;

  @prop()
  endDate?: Date;

  @prop()
  promotionName?: string;
}

// Per-product engraving/personalisation configuration.
export class Engraving {
  @prop({ default: false })
  available: boolean;

  // Flat fee added per engraved unit.
  @prop({ default: 0, min: 0 })
  fee: number;

  @prop({ default: 20, min: 1 })
  maxCharacters: number;

  @prop({ default: 1, min: 1 })
  maxLines: number;

  @prop({ type: () => [String], default: [] })
  fonts: string[];
}

@modelOptions({
  schemaOptions: { _id: true },
  options: { allowMixed: Severity.ALLOW },
})
export class Variant {
  @prop({ required: true, trim: true })
  name: string;

  @prop({ required: true, unique: false })
  sku: string;

  @prop({ required: true, default: 0, min: 0 })
  basePrice: number;

  @prop({ type: () => Discount, default: {}, _id: false })
  discount: Discount;

  @prop({ default: 0, min: 0 })
  quantity: number;

  // Values for the category's dynamic attributes, keyed by attribute id.
  @prop({ type: () => Object, default: {} })
  attributes: Record<string, unknown>;

  @prop({ type: () => [String], default: [] })
  tags: string[];

  @prop({ type: () => [String], default: [] })
  images: string[];

  @prop({ default: true })
  isActive: boolean;
}

@index({ name: "text", description: "text", brand: "text" })
@index({ category: 1 })
@index({ status: 1 })
@index({ slug: 1 })
@index({ variationGroup: 1 })
@index({ "variants.sku": 1 })
@pre<Product>("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-" + nanoid(6).toLowerCase();
  }
  if (this.variants?.length) {
    this.variants.forEach((variant) => {
      if (!variant.sku) {
        variant.sku = `SKU-${nanoid(8).toUpperCase()}`;
      }
    });
  }
  next();
})
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
export class Product {
  @prop({ required: true, trim: true })
  name: string;

  @prop({ unique: true, trim: true })
  slug: string;

  @prop({ required: true })
  description: string;

  @prop({ trim: true })
  metaTitle?: string;

  @prop({ trim: true })
  metaDescription?: string;

  @prop({ type: () => [String], default: [] })
  videos: string[];

  @prop({ default: 0 })
  viewCount: number;

  @prop({ default: 5 })
  lowStockThreshold: number;

  @prop()
  scheduledPublishAt?: Date;

  @prop({ trim: true })
  brand?: string;

  @prop({ ref: () => Category, required: true })
  category: Ref<Category>;

  @prop({ required: true, default: 0, min: 0 })
  basePrice: number;

  @prop({ type: () => Discount, default: {}, _id: false })
  discount: Discount;

  // Base (non-variant) stock.
  @prop({ default: 0, min: 0 })
  quantity: number;

  // Values for the category's dynamic attributes, keyed by attribute id.
  @prop({ type: () => Object, default: {} })
  attributes: Record<string, unknown>;

  @prop({ type: () => [String], default: [] })
  tags: string[];

  @prop()
  coverImage?: string;

  @prop({ type: () => [String], default: [] })
  images: string[];

  @prop()
  weight?: string;

  @prop({ default: false })
  isReturnable: boolean;

  @prop({ min: 0 })
  returnableDays?: number;

  @prop({ default: false })
  hasWarranty: boolean;

  @prop({ min: 0 })
  warrantyYears?: number;

  @prop({ type: () => Engraving, default: {}, _id: false })
  engraving: Engraving;

  @prop({ type: () => [Variant], default: [] })
  variants: Variant[];

  @prop({ trim: true })
  variationGroup?: string;

  @prop({ trim: true })
  variationLabel?: string;

  @prop({ trim: true })
  variationValue?: string;

  @prop({
    required: true,
    enum: ProductStatus,
    default: ProductStatus.Active,
  })
  status: ProductStatus;

  @prop({
    enum: ProductAudience,
    default: ProductAudience.Unisex,
    index: true,
  })
  audience: ProductAudience;

  @prop({ default: 0 })
  averageRating: number;

  @prop({ default: 0 })
  totalReviews: number;

  @prop({ default: 0 })
  totalSales: number;

  @prop({ type: () => [String], default: [] })
  relatedProducts: Ref<Product>[];

  // ── Methods ────────────────────────────────────────────────────────────────

  // Effective price after an active discount (variant-aware).
  getCurrentPrice(this: DocumentType<Product>, variantIndex?: number): number {
    const source =
      variantIndex !== undefined && this.variants[variantIndex]
        ? this.variants[variantIndex]
        : this;

    const discount = source.discount;
    if (discount?.price && discount.price > 0) {
      const now = new Date();
      const started = !discount.startDate || now >= discount.startDate;
      const notEnded = !discount.endDate || now <= discount.endDate;
      if (started && notEnded) return discount.price;
    }
    return source.basePrice;
  }

  isInStock(this: DocumentType<Product>, variantIndex?: number): boolean {
    if (variantIndex !== undefined && this.variants[variantIndex]) {
      return this.variants[variantIndex].quantity > 0;
    }
    return this.getTotalStock() > 0;
  }

  getTotalStock(this: DocumentType<Product>): number {
    const variantStock = (this.variants ?? []).reduce(
      (total, variant) => total + (variant.quantity ?? 0),
      0,
    );
    return this.quantity + variantStock;
  }
}

const ProductModel = getModelForClass(Product);
export default ProductModel;
