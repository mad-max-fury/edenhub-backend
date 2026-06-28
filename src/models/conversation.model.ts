import {
  getModelForClass,
  prop,
  Ref,
  modelOptions,
  index,
  Severity,
} from "@typegoose/typegoose";
import { User } from "./user.model";

export enum ConversationStatus {
  Open = "open",
  Closed = "closed",
}

export enum MessageSender {
  Customer = "customer",
  Admin = "admin",
}

export class Attachment {
  @prop({ required: true })
  url: string;

  @prop({ required: true, enum: ["image", "video", "audio", "document"] })
  type: string;

  @prop()
  name?: string;

  @prop()
  mimetype?: string;

  @prop()
  size?: number;
}

@modelOptions({ options: { allowMixed: Severity.ALLOW } })
export class Message {
  @prop({ required: true, enum: MessageSender })
  sender: MessageSender;

  @prop({ ref: () => User })
  senderId?: Ref<User>;

  @prop({ required: true, trim: true })
  body: string;

  @prop({ type: () => [Attachment], default: [] })
  attachments: Attachment[];

  @prop({ default: false })
  read: boolean;

  @prop({ default: () => new Date() })
  createdAt: Date;
}

@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
@index({ customer: 1 })
@index({ status: 1 })
@index({ updatedAt: -1 })
export class Conversation {
  @prop({ ref: () => User, required: true })
  customer: Ref<User>;

  @prop({ required: true, trim: true })
  subject: string;

  @prop({ enum: ConversationStatus, default: ConversationStatus.Open })
  status: ConversationStatus;

  @prop({ type: () => [Message], default: [] })
  messages: Message[];

  @prop()
  lastMessageAt?: Date;

  @prop()
  lastMessagePreview?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ConversationModel = getModelForClass(Conversation);
