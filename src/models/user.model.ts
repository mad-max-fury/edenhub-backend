import {
  prop,
  modelOptions,
  pre,
  getModelForClass,
  Severity,
  DocumentType,
  index,
  Ref,
} from "@typegoose/typegoose";
import argon2 from "argon2";
import log from "../utils/logger";
import { Types } from "mongoose";
import { Product } from "./product.model";
import { Role } from "./role.model";

@pre<User>("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await argon2.hash(this.password);
})
@index({ email: 1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,

    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class User {
  @prop({ lowercase: true, required: true, unique: true })
  email: string;

  @prop({ required: true })
  firstName: string;

  @prop({ required: true })
  lastName: string;

  @prop({ required: true, select: false })
  password: string;

  @prop({ ref: () => Role, required: true })
  role: Ref<Role>;

  @prop()
  phoneNumber?: string;

  @prop({ default: false })
  isVerified: boolean;

  @prop()
  verificationCode?: string;

  @prop()
  passwordResetCode: string | null;

  @prop()
  lastLogin?: Date;

  @prop({ default: true })
  isActive: boolean;

  @prop({ ref: () => Product, default: [] })
  wishlist: Ref<Product>[];

  async comparePassword(this: DocumentType<User>, candidatePassword: string) {
    try {
      return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
      log.error(error, "could not compare password");
      return false;
    }
  }

  /**
   * Fixed toJson implementation
   * Use 'any' for the intermediate object to avoid ID property errors
   */
  toJson(this: DocumentType<User>) {
    const userObject = this.toObject() as any;

    delete userObject.password;
    delete userObject.passwordResetCode;
    delete userObject.verificationCode;
    delete userObject.__v;

    if (userObject._id) {
      userObject.id = userObject._id.toString();
    }

    return userObject;
  }

  addToWishlist(this: DocumentType<User>, productId: string | Types.ObjectId) {
    const productRef =
      typeof productId === "string" ? new Types.ObjectId(productId) : productId;
    if (!this.wishlist.some((id) => id?.toString() === productRef.toString())) {
      (this.wishlist as Types.Array<Ref<Product>>).push(productRef as any);
    }
  }

  updateLastLogin(this: DocumentType<User>) {
    this.lastLogin = new Date();
    return this.save();
  }
}

const UserModel = getModelForClass(User);
export default UserModel;
