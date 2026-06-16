import {
  getModelForClass,
  prop,
  Ref,
  modelOptions,
  index,
  Severity,
} from "@typegoose/typegoose";

export enum AttributeInputType {
  Text = "text",
  Select = "select",
  Radio = "radio",
  Checkbox = "checkbox",
}

// Maximum allowed depth of the category tree (1 = root).
export const MAX_CATEGORY_DEPTH = 3;

export class AttributeOption {
  @prop({ required: true, trim: true })
  label: string;

  @prop({ required: true, trim: true })
  value: string;
}

export class CategoryAttribute {
  @prop({ required: true, trim: true })
  name: string;

  @prop({
    required: true,
    enum: AttributeInputType,
    default: AttributeInputType.Text,
  })
  inputType: AttributeInputType;

  @prop({ default: false })
  isRequired: boolean;

  @prop({ default: 0 })
  order: number;

  @prop({ type: () => [AttributeOption], default: [], _id: false })
  options: AttributeOption[];
}

@index({ name: "text", description: "text" })
@index({ parent: 1 })
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
export class Category {
  @prop({ required: true, trim: true })
  name: string;

  @prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @prop({ trim: true })
  description?: string;

  @prop({ ref: () => Category, default: null })
  parent?: Ref<Category> | null;

  // 1-based depth in the tree. Enforced to be <= MAX_CATEGORY_DEPTH.
  @prop({ default: 1 })
  level: number;

  @prop()
  image?: string;

  @prop({ default: true })
  isActive: boolean;

  @prop({ type: () => [CategoryAttribute], default: [] })
  attributes: CategoryAttribute[];
}

const CategoryModel = getModelForClass(Category);
export default CategoryModel;
