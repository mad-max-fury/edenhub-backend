import { getModelForClass, prop, modelOptions, Severity } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
export class StoreAddress {
  @prop({ required: true, trim: true })
  name: string;

  @prop({ required: true, trim: true })
  email: string;

  @prop({ required: true, trim: true })
  phone: string;

  @prop({ required: true, trim: true })
  address: string;

  @prop({ required: true, trim: true })
  city: string;

  @prop({ required: true, trim: true })
  state: string;

  @prop({ default: "Nigeria", trim: true })
  country: string;

  @prop({ trim: true })
  postalCode?: string;

  @prop({ trim: true })
  addressCode?: string;

  @prop({ default: false })
  isDefault: boolean;
}

const StoreAddressModel = getModelForClass(StoreAddress);
export default StoreAddressModel;
