import {
  prop,
  modelOptions,
  pre,
  getModelForClass,
  Severity,
  DocumentType,
  index,
} from "@typegoose/typegoose";
import argon2 from "argon2";
import log from "../utils/logger";

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
  passwordResetCode: string | null;
  async comparePassword(this: DocumentType<User>, candidatePassword: string) {
    try {
      const isMatch = await argon2.verify(this.password, candidatePassword);
      return isMatch;
    } catch (error) {
      log.error(error, "could not compare password");
      return false;
    }
  }
}

const UserModal = getModelForClass(User);

export default UserModal;
