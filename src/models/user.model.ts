import {
  prop,
  modelOptions,
  pre,
  getModelForClass,
  Severity,
  DocumentType,
  Ref,
  index,
} from "@typegoose/typegoose";
import argon2 from "argon2";
import log from "../utils/logger";
import { Types } from "mongoose";
import { Product } from "./product.model";
import { Role } from "./role.model";

export class UserAddress {
  @prop({ required: true, trim: true })
  firstName: string;

  @prop({ required: true, trim: true })
  lastName: string;

  @prop({ trim: true })
  fullName?: string;

  @prop({ trim: true })
  phone?: string;

  @prop({ trim: true })
  additionalPhone?: string;

  @prop({ required: true, trim: true })
  address: string;

  @prop({ trim: true })
  landmark?: string;

  @prop({ required: true, trim: true })
  city: string;

  @prop({ required: true, trim: true })
  state: string;

  @prop({ default: "Nigeria", trim: true })
  country: string;

  @prop({ trim: true })
  postalCode?: string;

  @prop({ default: false })
  isDefault: boolean;
}

// Unique only among users that actually have a staffId (staff). Customers have
// none, so they are excluded entirely and never collide on null.
@index(
  { staffId: 1 },
  { unique: true, partialFilterExpression: { staffId: { $type: "string" } } },
)
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

  // Uniqueness enforced via a partial index on the class (see @index above).
  @prop()
  staffId?: string;

  @prop()
  phoneNumber?: string;

  @prop()
  country?: string;

  @prop()
  state?: string;

  @prop()
  city?: string;

  @prop({ default: false })
  isVerified: boolean;

  @prop()
  verificationCode?: string;

  @prop()
  passwordResetCode: string | null;

  @prop({ required: false, select: true })
  profilePicture: string;

  public profilePictureUrl?: string;

  @prop()
  lastLogin?: Date;

  @prop({ default: true })
  isActive: boolean;

  @prop({ default: false })
  twoFactorEnabled: boolean;

  @prop({ default: "email" })
  twoFactorMethod: string;

  @prop()
  twoFactorSecret?: string;

  @prop()
  deletionRequestedAt?: Date;

  @prop()
  deletionReason?: string;

  @prop()
  googleId?: string;

  @prop({ ref: () => Product, default: [] })
  wishlist: Ref<Product>[];

  @prop({ type: () => [UserAddress], default: [], _id: true })
  addresses: UserAddress[];

  // Admin/customer notification toggles, keyed by preference id.
  @prop({ type: () => Object, default: {} })
  notificationPreferences: Record<string, boolean>;

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
