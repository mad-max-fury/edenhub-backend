import {
  getModelForClass,
  prop,
  Ref,
  modelOptions,
  index,
  Severity,
} from "@typegoose/typegoose";
import { User } from "./user.model";
import { Product } from "./product.model";

export class CartItem {
  @prop({ ref: () => Product, required: true })
  product: Ref<Product>;

  @prop()
  variantId?: string;

  @prop({ required: true, default: 1, min: 1 })
  quantity: number;
}

@index({ user: 1 }, { unique: true })
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
export class Cart {
  @prop({ ref: () => User, required: true })
  user: Ref<User>;

  @prop({ type: () => [CartItem], default: [], _id: true })
  items: CartItem[];
}

const CartModel = getModelForClass(Cart);
export default CartModel;
