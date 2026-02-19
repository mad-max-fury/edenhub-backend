import {
  prop,
  getModelForClass,
  modelOptions,
  Ref,
} from "@typegoose/typegoose";
import { Menu } from "./menu.model";
import { Claim } from "./claim.model";

@modelOptions({ schemaOptions: { timestamps: true } })
export class Role {
  @prop({ required: true, unique: true })
  name: string;

  @prop({ ref: () => Menu, type: () => [String], default: [] })
  menus: Ref<Menu>[];

  @prop({ ref: () => Claim, type: () => [String], default: [] })
  claims: Ref<Claim>[];

  @prop({ default: true })
  isActive: boolean;
}

const RoleModel = getModelForClass(Role);
export default RoleModel;
