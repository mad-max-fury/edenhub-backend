import { Types } from "mongoose";
import CartModel from "../models/cart.model";
import ProductModel from "../models/product.model";
import AppError from "../errors/appError";

const effectivePrice = (source: {
  basePrice: number;
  discount?: { price?: number; startDate?: Date; endDate?: Date };
}) => {
  const d = source.discount;
  if (d?.price && d.price > 0) {
    const now = new Date();
    const started = !d.startDate || now >= new Date(d.startDate);
    const notEnded = !d.endDate || now <= new Date(d.endDate);
    if (started && notEnded) return d.price;
  }
  return source.basePrice;
};

const getOrCreateCart = async (userId: string) => {
  let cart = await CartModel.findOne({ user: userId });
  if (!cart) cart = await CartModel.create({ user: userId, items: [] });
  return cart;
};

// Build an enriched cart view with live prices/snapshots and totals.
const enrich = async (userId: string) => {
  const cart = await getOrCreateCart(userId);
  await cart.populate("items.product");

  let subtotal = 0;
  const items = cart.items
    .map((it: any) => {
      const product = it.product;
      if (!product) return null;

      let name = product.name;
      let image = product.coverImage;
      let sku: string | undefined;
      let unitPrice = effectivePrice(product);
      let stock = product.quantity;

      if (it.variantId) {
        const variant = (product.variants as any).id(it.variantId);
        if (variant) {
          name = `${product.name} - ${variant.name}`;
          image = variant.images?.[0] || product.coverImage;
          unitPrice = effectivePrice(variant);
          stock = variant.quantity;
          sku = variant.sku;
        }
      }

      const lineTotal = unitPrice * it.quantity;
      subtotal += lineTotal;

      return {
        _id: String(it._id),
        product: String(product._id),
        variantId: it.variantId,
        name,
        image,
        sku,
        unitPrice,
        quantity: it.quantity,
        lineTotal,
        stock,
      };
    })
    .filter(Boolean);

  return {
    items,
    subtotal,
    count: items.reduce((s, i: any) => s + i.quantity, 0),
  };
};

export const getCart = (userId: string) => enrich(userId);

export const addItem = async (
  userId: string,
  data: { product: string; variantId?: string; quantity?: number },
) => {
  const product = await ProductModel.findOne({
    _id: data.product,
    status: "active",
  });
  if (!product) throw new AppError("Product not available", 404);

  const cart = await getOrCreateCart(userId);
  const qty = data.quantity && data.quantity > 0 ? data.quantity : 1;

  const existing = cart.items.find(
    (it) =>
      String(it.product) === data.product &&
      (it.variantId || "") === (data.variantId || ""),
  );

  if (existing) {
    existing.quantity += qty;
  } else {
    cart.items.push({
      product: new Types.ObjectId(data.product) as any,
      variantId: data.variantId,
      quantity: qty,
    } as any);
  }

  await cart.save();
  return enrich(userId);
};

export const updateItem = async (
  userId: string,
  itemId: string,
  quantity: number,
) => {
  const cart = await getOrCreateCart(userId);
  const item = (cart.items as any).id(itemId);
  if (!item) throw new AppError("Cart item not found", 404);

  if (quantity <= 0) {
    item.deleteOne();
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  return enrich(userId);
};

export const removeItem = async (userId: string, itemId: string) => {
  const cart = await getOrCreateCart(userId);
  (cart.items as any).pull({ _id: new Types.ObjectId(itemId) });
  await cart.save();
  return enrich(userId);
};

export const clearCart = async (userId: string) => {
  await CartModel.findOneAndUpdate({ user: userId }, { items: [] });
  return enrich(userId);
};
