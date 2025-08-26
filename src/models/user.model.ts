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

@pre<User>("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const hashedPassword = await argon2.hash(this.password);
  this.password = hashedPassword;
  return;
})
@index({ email: 1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,
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

  @prop({ required: true })
  password: string;

  @prop({ default: "user", enum: ["user", "admin", "sub-admin"] })
  role: string;

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

  // @prop({
  //   type: () => [
  //     {
  //       street: String,
  //       city: String,
  //       state: String,
  //       zipCode: String,
  //       country: String,
  //       isDefault: Boolean,
  //     },
  //   ],
  //   default: [],
  // })
  // addresses: {
  //   street: string;
  //   city: string;
  //   state: string;
  //   zipCode: string;
  //   country: string;
  //   isDefault: boolean;
  // }[];

  // @prop({
  //   type: () => [
  //     {
  //       cardType: String,
  //       lastFourDigits: String,
  //       expiryMonth: Number,
  //       expiryYear: Number,
  //       isDefault: Boolean,
  //       cardHolderName: String,
  //     },
  //   ],
  // })
  // paymentMethods?: {
  //   cardType: string;
  //   lastFourDigits: string;
  //   expiryMonth: number;
  //   expiryYear: number;
  //   isDefault: boolean;
  //   cardHolderName: string;
  // }[];

  @prop({ ref: () => Product, default: [] })
  wishlist: Ref<Product>[];

  // @prop({
  //   type: () => ({
  //     pushNotifications: Boolean,
  //     emailNotifications: Boolean,
  //     smsNotifications: Boolean,
  //     marketingEmails: Boolean,
  //   }),
  //   default: {
  //     pushNotifications: true,
  //     emailNotifications: true,
  //     smsNotifications: false,
  //     marketingEmails: false,
  //   },
  // })
  // preferences: {
  //   pushNotifications: boolean;
  //   emailNotifications: boolean;
  //   smsNotifications: boolean;
  //   marketingEmails: boolean;
  // };

  // @prop({
  //   type: () => ({
  //     stripeCustomerId: String,
  //     paypalEmail: String,
  //   }),
  // })
  // paymentProfiles?: {
  //   stripeCustomerId?: string;
  //   paypalEmail?: string;
  // };

  async comparePassword(this: DocumentType<User>, candidatePassword: string) {
    try {
      const isMatch = await argon2.verify(this.password, candidatePassword);
      return isMatch;
    } catch (error) {
      log.error(error, "could not compare password");
      return false;
    }
  }

  toJson(this: DocumentType<Partial<User>>) {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.passwordResetCode;
    delete userObject.verificationCode;
    // delete userObject.paymentMethods;
    // delete userObject.paymentProfiles;
    return userObject;
  }

  getDefaultAddress(this: DocumentType<User>) {
    // return this.addresses.find((address) => address.isDefault);
  }

  getDefaultPaymentMethod(this: DocumentType<User>) {
    // return this.paymentMethods?.find((method) => method.isDefault);
  }

  addToWishlist(this: DocumentType<User>, productId: string | Types.ObjectId) {
    const productRef =
      typeof productId === "string" ? new Types.ObjectId(productId) : productId;
    if (!this.wishlist.some((id) => id?.toString() === productRef.toString())) {
      this.wishlist.push(productRef);
    }
  }

  removeFromWishlist(
    this: DocumentType<User>,
    productId: string | Types.ObjectId
  ) {
    const productRef =
      typeof productId === "string" ? new Types.ObjectId(productId) : productId;
    this.wishlist = this.wishlist.filter(
      (id) => id?.toString() !== productRef.toString()
    );
  }

  hasProductInWishlist(
    this: DocumentType<User>,
    productId: string | Types.ObjectId
  ): boolean {
    const productRef =
      typeof productId === "string" ? new Types.ObjectId(productId) : productId;
    return this.wishlist.some((id) => id?.toString() === productRef.toString());
  }

  updateLastLogin(this: DocumentType<User>) {
    this.lastLogin = new Date();
    return this.save();
  }

  setDefaultAddress(this: DocumentType<User>, addressIndex: number) {
    // this.addresses = this.addresses.map((address, index) => ({
    //   ...address,
    //   isDefault: index === addressIndex,
    // }));
  }

  setDefaultPaymentMethod(this: DocumentType<User>, methodIndex: number) {
    // if (this.paymentMethods) {
    //   this.paymentMethods = this.paymentMethods.map((method, index) => ({
    //     ...method,
    //     isDefault: index === methodIndex,
    //   }));
    // }
  }
}

const UserModel = getModelForClass(User);

export default UserModel;
