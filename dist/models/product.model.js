"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const typegoose_1 = require("@typegoose/typegoose");
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
let Product = class Product {
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
    getCurrentPrice(variantIndex = 0) {
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
    isInStock(variantIndex = 0) {
        // return this.variants[variantIndex]?.stock > 0;
        return false;
    }
    getTotalStock() {
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
    updateStock(variantIndex, quantity) {
        return __awaiter(this, void 0, void 0, function* () {
            // const variant = this.variants[variantIndex];
            // if (!variant || variant.stock < quantity) {
            //   return false;
            // }
            // variant.stock -= quantity;
            this.totalSales += quantity;
            yield this.save();
            return true;
        });
    }
    // getVariantBySku(
    //   this: DocumentType<Product>,
    //   sku: string
    // ): Variant | undefined {
    //   return this.variants.find((variant) => variant.sku === sku);
    // }
    toJSON() {
        const obj = this.toObject();
        // obj.variants = obj.variants.map((variant: Variant, index: number) => ({
        //   ...variant,
        //   currentPrice: this.getCurrentPrice(index),
        //   inStock: this.isInStock(index),
        // }));
        return obj;
    }
};
exports.Product = Product;
__decorate([
    (0, typegoose_1.prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Product.prototype, "brand", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "basePrice", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "averageRating", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "totalReviews", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "totalSales", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "isActive", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => [String], default: [] }),
    __metadata("design:type", Array)
], Product.prototype, "relatedProducts", void 0);
exports.Product = Product = __decorate([
    (0, typegoose_1.index)({ name: "text", description: "text" }),
    (0, typegoose_1.index)({ brand: 1 }),
    (0, typegoose_1.index)({ "variants.sku": 1 })
    // @pre<Product>("save", function () {
    //   if (this.isModified("reviews")) {
    //     const totalRatings = this.reviews.length;
    //     if (totalRatings > 0) {
    //       const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    //       this.averageRating = Number((sum / totalRatings).toFixed(1));
    //     }
    //   }
    // })
    ,
    (0, typegoose_1.modelOptions)({
        schemaOptions: {
            timestamps: true,
        },
        options: {
            allowMixed: typegoose_1.Severity.ALLOW,
        },
    })
], Product);
const ProductModel = (0, typegoose_1.getModelForClass)(Product);
exports.default = ProductModel;
