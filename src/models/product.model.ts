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
import { User } from "./user.model"; // Make sure this path is correct
import { Types } from "mongoose";
// import { Review } from "./review.model";

// Define the Discount class
// class Discount {
//   @prop({ required: true, enum: ["percentage", "fixed"] })
//   type: "percentage" | "fixed";

//   @prop({ required: true })
//   value: number;

//   @prop({ required: true })
//   startDate: Date;

//   @prop({ required: true })
//   endDate: Date;

//   @prop({ required: true })
//   isActive: boolean;
// }

// Define the Variant class
// class Variant {
//   @prop({ required: true })
//   color: string;

//   @prop({ required: true })
//   caseSize: number;

//   @prop({ required: true })
//   strap: string;

//   @prop({ required: true })
//   price: number;

//   @prop({ required: true })
//   stock: number;

//   @prop({ required: true })
//   sku: string;

//   @prop({ type: () => [String], default: [] })
//   images: string[];
// }

// Define the Specifications class
// class Specifications {
//   @prop({ required: true })
//   movement: string;

//   @prop({ required: true })
//   waterResistance: string;

//   @prop({ required: true })
//   caseMaterial: string;

//   @prop({ required: true })
//   crystalType: string;

//   @prop({ required: true })
//   dialColor: string;

//   @prop({ type: () => [String], default: [] })
//   functions: string[];

//   @prop({ required: true })
//   powerReserve: string;

//   @prop({ required: true })
//   warranty: string;
// }

// Define the Product class
@index({ name: "text", description: "text" })
@index({ brand: 1 })
@index({ "variants.sku": 1 })
// @pre<Product>("save", function () {
//   if (this.isModified("reviews")) {
//     const totalRatings = this.reviews.length;
//     if (totalRatings > 0) {
//       const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
//       this.averageRating = Number((sum / totalRatings).toFixed(1));
//     }
//   }
// })
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Product {
  @prop({ required: true, trim: true })
  name: string;

  @prop({ required: true })
  description: string;

  @prop({ required: true })
  brand: string;

  @prop({ required: true, default: 0 })
  basePrice: number;

  // @prop({ required: true, enum: ["analog", "digital", "smart", "luxury"] })
  // category: string;

  // @prop({ type: () => [String], default: [] })
  // tags: string[];

  // @prop({ type: () => Discount })
  // discount?: Discount;

  // @prop({ type: () => [Variant], required: true, _id: false })
  // variants: Variant[];

  // @prop({ type: () => Specifications, required: true })
  // specifications: Specifications;

  // @prop({ type: () => [Review], default: [] })
  // reviews: Review[];

  @prop({ default: 0 })
  averageRating: number;

  @prop({ default: 0 })
  totalReviews: number;

  @prop({ default: 0 })
  totalSales: number;

  @prop({ default: true })
  isActive: boolean;

  @prop({ type: () => [String], default: [] })
  relatedProducts: Ref<Product>[];

  // @prop({
  //   type: () => ({
  //     width: Number,
  //     height: Number,
  //     depth: Number,
  //     weight: Number,
  //   }),
  // })
  // dimensions?: {
  //   width: number;
  //   height: number;
  //   depth: number;
  //   weight: number;
  // };

  // @prop({
  //   type: () => ({
  //     title: String,
  //     keywords: [String],
  //     description: String,
  //   }),
  // })
  // seo?: {
  //   title: string;
  //   keywords: string[];
  //   description: string;
  // };

  // Methods
  getCurrentPrice(
    this: DocumentType<Product>,
    variantIndex: number = 0
  ): number {
    // const variant = this.variants[variantIndex];
    // if (!variant) return this.basePrice;

    // if (this.discount && this.discount.isActive) {
    //   const now = new Date();
    //   if (now >= this.discount.startDate && now <= this.discount.endDate) {
    //     if (this.discount.type === "percentage") {
    //       return variant.price * (1 - this.discount.value / 100);
    //     } else {
    //       return Math.max(0, variant.price - this.discount.value);
    //     }
    //   }
    // }
    // return variant.price;
    return this.basePrice;
  }

  isInStock(this: DocumentType<Product>, variantIndex: number = 0): boolean {
    // return this.variants[variantIndex]?.stock > 0;
    return false;
  }

  getTotalStock(this: DocumentType<Product>): number {
    // return this.variants.reduce((total, variant) => total + variant.stock, 0);
    return 0;
  }

  // async addReview(
  //   this: DocumentType<Product>,
  //   userId: Ref<User>,
  //   rating: number,
  //   comment: string,
  //   title: string,
  //   images: string[] = []
  // ) {
  //   const review = {
  //     user: userId,
  //     rating,
  //     comment,
  //     title,
  //     verified: false,
  //     createdAt: new Date(),
  //     images,
  //     likes: 0,
  //     helpful: 0,
  //   };

  //   this.reviews.push(review);
  //   this.totalReviews = this.reviews.length;
  //   await this.save();
  //   return review;
  // }

  async updateStock(
    this: DocumentType<Product>,
    variantIndex: number,
    quantity: number
  ): Promise<boolean> {
    // const variant = this.variants[variantIndex];
    // if (!variant || variant.stock < quantity) {
    //   return false;
    // }

    // variant.stock -= quantity;
    this.totalSales += quantity;
    await this.save();
    return true;
  }

  // getVariantBySku(
  //   this: DocumentType<Product>,
  //   sku: string
  // ): Variant | undefined {
  //   return this.variants.find((variant) => variant.sku === sku);
  // }

  toJSON(this: DocumentType<Product>) {
    const obj = this.toObject();

    // obj.variants = obj.variants.map((variant: Variant, index: number) => ({
    //   ...variant,
    //   currentPrice: this.getCurrentPrice(index),
    //   inStock: this.isInStock(index),
    // }));

    return obj;
  }
}

const ProductModel = getModelForClass(Product);

export default ProductModel;
