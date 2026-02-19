import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { timestamps: true } })
export class Claim {
  @prop({ required: true, unique: true })
  name: string;

  @prop({ required: true })
  endpoint: string;

  @prop({ required: true })
  method: string;

  @prop()
  description?: string;
}

const ClaimModel = getModelForClass(Claim);
export default ClaimModel;
