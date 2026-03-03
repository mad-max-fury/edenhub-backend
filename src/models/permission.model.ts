import { prop, index, getModelForClass } from "@typegoose/typegoose";

@index({ endpoint: 1, method: 1 }, { unique: true })
export class Permission {
  @prop({ required: true, unique: true })
  name: string;

  @prop({ required: true })
  endpoint: string;

  @prop({ required: true })
  method: string;

  @prop({ required: true })
  resource: string;

  @prop({ required: true })
  action: string;

  @prop({ default: true })
  isActive: boolean;
}

const PermissionModel = getModelForClass(Permission);
export default PermissionModel;
