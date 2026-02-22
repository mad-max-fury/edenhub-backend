import {
  prop,
  modelOptions,
  pre,
  getModelForClass,
  Severity,
  DocumentType,
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
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.passwordResetCode;
        delete ret.verificationCode;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class User {
  @prop({ lowercase: true, required: true, unique: true, trim: true })
  email: string;

  @prop({ required: true, trim: true })
  firstName: string;

  @prop({ required: true, trim: true })
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

  @prop({ required: false, select: false })
  profilePicture: string;

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
      log.error(error, "Could not compare password");
      return false;
    }
  }

  addToWishlist(this: DocumentType<User>, productId: string | Types.ObjectId) {
    const productRef =
      typeof productId === "string" ? new Types.ObjectId(productId) : productId;

    const exists = this.wishlist.some(
      (id) => id?.toString() === productRef.toString(),
    );

    if (!exists) {
      (this.wishlist as Types.Array<Ref<Product>>).push(productRef as any);
    }
  }

  async updateLastLogin(this: DocumentType<User>) {
    this.lastLogin = new Date();
    return this.save();
  }
}

const UserModel = getModelForClass(User);
export default UserModel;
