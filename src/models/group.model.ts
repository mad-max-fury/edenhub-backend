import { getModelForClass, prop, Ref } from "@typegoose/typegoose";
import { Permission } from "./permission.model";

export class Group {
  @prop({ required: true, unique: true })
  name: string; // e.g., "User Management"

  // Menu Metadata for the Frontend
  @prop()
  path?: string; // e.g., "/admin/users"

  @prop()
  icon?: string;

  @prop({ default: 0 })
  order: number;

  @prop({ ref: () => Permission, default: [] })
  permissions: Ref<Permission>[];
}

const GroupModel = getModelForClass(Group);
export default GroupModel;
