import { getModelForClass, prop, Ref } from "@typegoose/typegoose";
import { Group } from "./group.model";
import { Permission } from "./permission.model";

class RoleGroup {
  @prop({ ref: () => Group, required: true })
  id: Ref<Group>;

  @prop({ ref: () => Permission, default: [] })
  permissionsId: Ref<Permission>[];
}

export class Role {
  @prop({ required: true, unique: true })
  name: string;

  @prop({ type: () => RoleGroup, _id: false, default: [] })
  groups: RoleGroup[];

  @prop({ ref: () => Permission, default: [] })
  permissions: Ref<Permission>[];

  @prop({ default: true })
  isActive: boolean;
}

const RoleModel = getModelForClass(Role);
export default RoleModel;
