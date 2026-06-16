import { FilterQuery } from "mongoose";
import { nanoid } from "nanoid";
import OrderModel, {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
} from "../models/order.model";
import ProductModel from "../models/product.model";
import UserModel from "../models/user.model";
import AppError from "../errors/appError";
import log from "../utils/logger";
import { getConfig } from "../config";
import { IPaginationQuery } from "../utils/pagination.utils";
import { createAdminNotification } from "./notification.service";
import { NotificationType } from "../models/notification.model";
import {
  initializeTransaction,
  refundTransaction,
  verifyTransaction,
} from "./payment.service";
import * as shipping from "./shipping.service";
import {
  CreateOrderInput,
  FetchRatesInput,
} from "../schemas/order.schema";

const generateOrderNumber = () => `ORD-${nanoid(8).toUpperCase()}`;

// Effective unit price honouring an active discount.
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

// direction: -1 to reserve (decrement), +1 to restore.
const adjustStock = async (items: OrderItem[], direction: 1 | -1) => {
  for (const item of items) {
    if (!item.product) continue;
    const product = await ProductModel.findById(item.product);
    if (!product) continue;

    if (item.variantId) {
      const variant = (product.variants as any).id(item.variantId);
      if (variant) {
        variant.quantity = Math.max(0, variant.quantity + direction * item.quantity);
      }
    } else {
      product.quantity = Math.max(0, product.quantity + direction * item.quantity);
    }
    await product.save();
  }
};

// ─── Rates ─────────────────────────────────────────────────────────────────

export const getRates = async (input: FetchRatesInput) => {
  const rateItems = [];
  for (const line of input.items) {
    const product = await ProductModel.findById(line.product);
    if (!product) {
      throw new AppError(`Product ${line.product} not found`, 404);
    }
    let name = product.name;
    let price = effectivePrice(product);
    if (line.variantId) {
      const variant = (product.variants as any).id(line.variantId);
      if (variant) {
        name = `${product.name} - ${variant.name}`;
        price = effectivePrice(variant);
      }
    }
    rateItems.push({
      name,
      unitPrice: price,
      quantity: line.quantity,
      weight: 0.5,
    });
  }

  const r = input.receiver;
  return shipping.fetchRates({
    receiver: {
      name: r.fullName,
      email: r.email || getOrFallbackEmail(),
      phone: r.phone || "08000000000",
      address: `${r.address}, ${r.city}, ${r.state}, ${r.country}`,
    },
    items: rateItems,
  });
};

const getOrFallbackEmail = () => "customer@edenhub.com";

// ─── Create ────────────────────────────────────────────────────────────────

export const createOrder = async (data: CreateOrderInput) => {
  const customer = await UserModel.findById(data.customer);
  if (!customer) throw new AppError("Customer not found", 404);

  let subtotal = 0;
  const items: OrderItem[] = [];

  for (const line of data.items) {
    const product = await ProductModel.findById(line.product);
    if (!product) {
      throw new AppError(`Product ${line.product} not found`, 404);
    }

    let name = product.name;
    let sku: string | undefined;
    let image = product.coverImage;
    let unitPrice = effectivePrice(product);

    if (line.variantId) {
      const variant = (product.variants as any).id(line.variantId);
      if (!variant) {
        throw new AppError(`Variant not found on ${product.name}`, 404);
      }
      name = `${product.name} - ${variant.name}`;
      sku = variant.sku;
      image = variant.images?.[0] || product.coverImage;
      unitPrice = effectivePrice(variant);
      if (variant.quantity < line.quantity) {
        throw new AppError(`Insufficient stock for ${name}`, 400);
      }
    } else if (product.quantity < line.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}`, 400);
    }

    const lineTotal = unitPrice * line.quantity;
    subtotal += lineTotal;
    items.push({
      product: product._id,
      variantId: line.variantId,
      name,
      sku,
      image,
      unitPrice,
      quantity: line.quantity,
      lineTotal,
      attributes: line.attributes || {},
    } as OrderItem);
  }

  const shippingFee = data.shippingFee ?? data.selectedCourier?.amount ?? 0;
  const discountTotal = data.discountTotal ?? 0;
  const taxAmount = data.taxAmount ?? 0;
  const grandTotal = Math.max(
    0,
    subtotal - discountTotal + shippingFee + taxAmount,
  );

  // Reserve stock before creating the order.
  await adjustStock(items, -1);

  const orderNumber = generateOrderNumber();
  const order = await OrderModel.create({
    orderNumber,
    customer: customer._id,
    items,
    subtotal,
    discountTotal,
    shippingFee,
    taxAmount,
    grandTotal,
    shippingAddress: data.shippingAddress,
    billingAddress: data.billingAddress || data.shippingAddress,
    customerNote: data.customerNote,
    shipment: data.selectedCourier
      ? {
          courier: data.selectedCourier.courierName,
          courierId: data.selectedCourier.courierId,
          serviceCode: data.selectedCourier.serviceCode,
          requestToken: data.selectedCourier.requestToken,
        }
      : {},
    timeline: [{ type: "status", message: "Order created", at: new Date() }],
  });

  createAdminNotification({
    type: NotificationType.Order,
    title: "New order received",
    message: `${orderNumber} · ₦${grandTotal.toLocaleString()}`,
    link: `/admin/orders/${order._id}`,
    meta: { orderId: String(order._id) },
  });

  // Notify on any product that dropped below the low-stock threshold.
  const lowStock = await ProductModel.find({
    _id: { $in: items.map((i) => i.product) },
    quantity: { $lt: 5 },
  }).select("name quantity");
  lowStock.forEach((p) =>
    createAdminNotification({
      type: NotificationType.Stock,
      title: "Low stock alert",
      message: `${p.name} has ${p.quantity} left`,
      link: `/admin/products/${p._id}`,
    }),
  );

  // Initialize payment. If Paystack isn't configured we keep the order as
  // pending so it can still be managed (and paid via manual verify later).
  try {
    const init = await initializeTransaction({
      email: customer.email,
      amount: grandTotal,
      reference: orderNumber,
      metadata: { orderId: String(order._id), customerId: String(customer._id) },
      callbackUrl: `${getConfig("storefrontUrl")}/checkout/callback`,
    });
    order.paymentReference = init.reference;
    order.paymentAuthorizationUrl = init.authorizationUrl;
    await order.save();
  } catch (err) {
    log.error(err, "Paystack initialize failed; order left pending");
  }

  return order.populate("customer", "firstName lastName email");
};

// ─── Read ──────────────────────────────────────────────────────────────────

export interface OrderListQuery extends IPaginationQuery {
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  customer?: string;
}

export const getAllOrders = async (query: OrderListQuery) => {
  const {
    pageNumber,
    pageSize,
    orderBy,
    searchTerm,
    status,
    paymentStatus,
    fulfillmentStatus,
    customer,
  } = query;

  const filter: FilterQuery<Order> = {};
  if (status && status !== "all") filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (fulfillmentStatus) filter.fulfillmentStatus = fulfillmentStatus;
  if (customer) filter.customer = customer;
  if (searchTerm) {
    filter.$or = [
      { orderNumber: { $regex: searchTerm, $options: "i" } },
      { "shippingAddress.fullName": { $regex: searchTerm, $options: "i" } },
    ];
  }

  const skip = (pageNumber - 1) * pageSize;
  const sort = orderBy || "-createdAt";

  const [orders, totalCount] = await Promise.all([
    OrderModel.find(filter)
      .populate("customer", "firstName lastName email")
      .sort(sort)
      .skip(skip)
      .limit(pageSize),
    OrderModel.countDocuments(filter),
  ]);

  return { orders, totalCount };
};

export const getOrderById = async (id: string) => {
  const order = await OrderModel.findById(id).populate(
    "customer",
    "firstName lastName email phoneNumber",
  );
  if (!order) throw new AppError("Order not found", 404);
  return order;
};

// ─── Customer-scoped (storefront) ───────────────────────────────────────────

export const getCustomerOrders = (userId: string, query: OrderListQuery) =>
  getAllOrders({ ...query, customer: userId });

export const getCustomerOrderById = async (userId: string, id: string) => {
  const order = await getOrderById(id);
  const ownerId =
    typeof (order.customer as any)?._id !== "undefined"
      ? String((order.customer as any)._id)
      : String(order.customer);
  if (ownerId !== userId) throw new AppError("Order not found", 404);
  return order;
};

export const verifyCustomerPayment = async (userId: string, id: string) => {
  await getCustomerOrderById(userId, id); // ownership check
  return verifyPayment(id);
};

export const getOrderStats = async () => {
  const [agg] = await OrderModel.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSales: {
          $sum: {
            $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$grandTotal", 0],
          },
        },
        fulfilled: {
          $sum: {
            $cond: [
              { $in: ["$fulfillmentStatus", ["fulfilled", "shipped", "delivered"]] },
              1,
              0,
            ],
          },
        },
        unfulfilled: {
          $sum: {
            $cond: [{ $eq: ["$fulfillmentStatus", "unfulfilled"] }, 1, 0],
          },
        },
        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
      },
    },
  ]);

  return {
    totalOrders: agg?.totalOrders ?? 0,
    totalSales: agg?.totalSales ?? 0,
    fulfilled: agg?.fulfilled ?? 0,
    unfulfilled: agg?.unfulfilled ?? 0,
    pending: agg?.pending ?? 0,
    completed: agg?.completed ?? 0,
  };
};

// ─── Transitions ─────────────────────────────────────────────────────────────

const pushTimeline = (
  order: any,
  type: string,
  message: string,
  by?: string,
) => {
  order.timeline.push({ type, message, by, at: new Date() });
};

export const updateOrderStatus = async (
  id: string,
  status: OrderStatus,
  by?: string,
) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new AppError("Order not found", 404);

  // Cancelling restores any reserved stock once.
  if (status === OrderStatus.Cancelled && order.status !== OrderStatus.Cancelled) {
    await adjustStock(order.items, 1);
  }

  order.status = status;
  pushTimeline(order, "status", `Order marked ${status}`, by);
  await order.save();
  return order;
};

export const updatePaymentStatus = async (
  id: string,
  paymentStatus: PaymentStatus,
  by?: string,
) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new AppError("Order not found", 404);

  order.paymentStatus = paymentStatus;
  if (paymentStatus === PaymentStatus.Paid) {
    order.paidAt = new Date();
    if (order.status === OrderStatus.Pending) order.status = OrderStatus.Processing;
  }
  pushTimeline(order, "payment", `Payment marked ${paymentStatus}`, by);
  await order.save();
  return order;
};

export const updateFulfillmentStatus = async (
  id: string,
  fulfillmentStatus: FulfillmentStatus,
  by?: string,
) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new AppError("Order not found", 404);

  order.fulfillmentStatus = fulfillmentStatus;
  if (fulfillmentStatus === FulfillmentStatus.Delivered) {
    order.shipment.deliveredAt = new Date();
    if (order.status === OrderStatus.Processing) order.status = OrderStatus.Completed;
  }
  pushTimeline(order, "fulfillment", `Fulfillment marked ${fulfillmentStatus}`, by);
  await order.save();
  return order;
};

// Mark an order paid from a verified Paystack transaction.
const applyPaidState = async (order: any) => {
  order.paymentStatus = PaymentStatus.Paid;
  order.paidAt = new Date();
  if (order.status === OrderStatus.Pending) order.status = OrderStatus.Processing;
  pushTimeline(order, "payment", "Payment confirmed via Paystack");
  await order.save();

  createAdminNotification({
    type: NotificationType.Payment,
    title: "Payment received",
    message: `${order.orderNumber} · ₦${order.grandTotal.toLocaleString()}`,
    link: `/admin/orders/${order._id}`,
  });
};

export const verifyPayment = async (id: string) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  if (!order.paymentReference) {
    throw new AppError("Order has no payment reference to verify", 400);
  }
  if (order.paymentStatus === PaymentStatus.Paid) return order;

  const result = await verifyTransaction(order.paymentReference);
  if (result.paid) {
    await applyPaidState(order);
  } else {
    order.paymentStatus = PaymentStatus.Failed;
    pushTimeline(order, "payment", `Payment ${result.status}`);
    await order.save();
  }
  return order;
};

// Process a verified Paystack webhook event.
export const handlePaystackWebhook = async (event: any) => {
  if (event?.event !== "charge.success") return;
  const reference = event?.data?.reference;
  if (!reference) return;

  const order = await OrderModel.findOne({ paymentReference: reference });
  if (!order || order.paymentStatus === PaymentStatus.Paid) return;
  await applyPaidState(order);
};

export const refundOrder = async (id: string, amount?: number, by?: string) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  if (!order.paymentReference) {
    throw new AppError("Order has no payment to refund", 400);
  }

  await refundTransaction({ reference: order.paymentReference, amount });

  order.paymentStatus = PaymentStatus.Refunded;
  await adjustStock(order.items, 1);
  pushTimeline(
    order,
    "payment",
    amount ? `Refunded ₦${amount}` : "Full refund issued",
    by,
  );
  await order.save();
  return order;
};

export const cancelOrder = async (id: string, by?: string) => {
  return updateOrderStatus(id, OrderStatus.Cancelled, by);
};

// ─── Fulfillment (Shipbubble) ───────────────────────────────────────────────

export const shipOrder = async (
  id: string,
  params: { serviceCode: string; courierId: string; requestToken?: string },
  by?: string,
) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new AppError("Order not found", 404);

  const requestToken = params.requestToken || order.shipment?.requestToken;
  if (!requestToken) {
    throw new AppError(
      "No shipping rate token available. Fetch rates again before shipping.",
      400,
    );
  }

  const label = await shipping.createLabel({
    requestToken,
    serviceCode: params.serviceCode,
    courierId: params.courierId,
  });

  order.shipment.shipbubbleOrderId = label.shipbubbleOrderId;
  order.shipment.trackingNumber = label.trackingNumber;
  order.shipment.trackingUrl = label.trackingUrl;
  order.shipment.labelUrl = label.labelUrl;
  if (label.courier) order.shipment.courier = label.courier;
  order.shipment.shippedAt = new Date();
  order.fulfillmentStatus = FulfillmentStatus.Shipped;
  pushTimeline(order, "fulfillment", "Shipment booked via Shipbubble", by);
  await order.save();
  return order;
};

export const trackOrder = async (id: string) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  if (!order.shipment?.shipbubbleOrderId) {
    throw new AppError("Order has no shipment to track", 400);
  }

  const tracking = await shipping.trackShipment(order.shipment.shipbubbleOrderId);

  // Best-effort status mapping.
  const status = String(tracking?.status || "").toLowerCase();
  if (status.includes("deliver")) {
    order.fulfillmentStatus = FulfillmentStatus.Delivered;
    order.shipment.deliveredAt = new Date();
    if (order.status === OrderStatus.Processing) order.status = OrderStatus.Completed;
    await order.save();
  }

  return { order, tracking };
};
