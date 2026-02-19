import {
  prop,
  getModelForClass,
  modelOptions,
  Ref,
} from "@typegoose/typegoose";
import { Claim } from "./claim.model";

@modelOptions({ schemaOptions: { timestamps: true } })
export class Menu {
  @prop({ required: true })
  title: string;

  @prop({ required: true })
  path: string;

  @prop({ ref: () => Claim, required: true, type: () => [String] })
  associatedClaims: Ref<Claim>[];

  @prop({ ref: () => Menu })
  parentId?: Ref<Menu>;

  @prop({ default: 0 })
  order: number;
}

const MenuModel = getModelForClass(Menu);
export default MenuModel;
