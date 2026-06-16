import {
  getModelForClass,
  prop,
  Ref,
  modelOptions,
  index,
  Severity,
} from "@typegoose/typegoose";
import { User } from "./user.model";

export enum NotificationType {
  Order = "order",
  Payment = "payment",
  Stock = "stock",
  Review = "review",
  Customer = "customer",
  System = "system",
}

@index({ audience: 1, createdAt: -1 })
@index({ recipient: 1, createdAt: -1 })
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
export class Notification {
  // "admin" notifications are shared across all admins; "user" ones target a
  // specific recipient.
  @prop({ required: true, default: "admin" })
  audience: string;

  @prop({ ref: () => User, default: null })
  recipient?: Ref<User> | null;

  @prop({ required: true, enum: NotificationType, default: NotificationType.System })
  type: NotificationType;

  @prop({ required: true })
  title: string;

  @prop({ required: true })
  message: string;

  @prop()
  link?: string;

  // Users who have read this notification (supports shared admin feed).
  @prop({ ref: () => User, default: [] })
  readBy: Ref<User>[];

  @prop({ type: () => Object, default: {} })
  meta: Record<string, unknown>;
}

const NotificationModel = getModelForClass(Notification);
export default NotificationModel;
