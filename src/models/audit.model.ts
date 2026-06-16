import {
  getModelForClass,
  prop,
  Ref,
  modelOptions,
  index,
  Severity,
} from "@typegoose/typegoose";
import { User } from "./user.model";

export enum AuditSeverity {
  Low = "low",
  Medium = "medium",
  High = "high",
}

@index({ createdAt: -1 })
@index({ category: 1 })
@index({ severity: 1 })
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
export class AuditLog {
  // The acting user; null for anonymous actions (e.g. login attempts).
  @prop({ ref: () => User, default: null })
  actor?: Ref<User> | null;

  // Snapshot of the actor's email at log time (useful when actor is null).
  @prop()
  actorEmail?: string;

  @prop({ required: true })
  method: string;

  @prop({ required: true })
  endpoint: string;

  @prop()
  resource?: string;

  @prop({ required: true })
  category: string;

  @prop({ required: true })
  action: string;

  @prop()
  details?: string;

  @prop()
  ipAddress?: string;

  @prop({ required: true, default: 200 })
  statusCode: number;

  @prop({
    required: true,
    enum: AuditSeverity,
    default: AuditSeverity.Low,
  })
  severity: AuditSeverity;
}

const AuditLogModel = getModelForClass(AuditLog);
export default AuditLogModel;
