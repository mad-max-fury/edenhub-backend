import { getModelForClass, prop, Ref } from "@typegoose/typegoose";
import { Permission } from "./permission.model";

export class Group {
  @prop({ required: true, unique: true })
  name: string;

  @prop()
  path?: string;

  @prop()
  icon?: string;

  @prop({ default: 0 })
  order: number;

  @prop({ ref: () => Permission, default: [] })
  permissions: Ref<Permission>[];
}

const GroupModel = getModelForClass(Group);
export default GroupModel;
