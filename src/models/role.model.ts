import { getModelForClass, prop, Ref } from "@typegoose/typegoose";
import { Group } from "./group.model";
import { Permission } from "./permission.model";

export class Role {
  @prop({ required: true, unique: true })
  name: string;

  @prop({ ref: () => Group, default: [] })
  groups: Ref<Group>[];

  @prop({ ref: () => Permission, default: [] })
  permissions: Ref<Permission>[];
}

const RoleModel = getModelForClass(Role);
export default RoleModel;
