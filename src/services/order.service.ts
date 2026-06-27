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
import { mailer } from "../utils/mailer.utils";
import {
  OrderEmailData,
  OrderEmailTemplates,
} from "../templates/orderEmail.templates";
import {
  initializeTransaction,
  refundTransaction,
  verifyTransaction,
} from "./payment.service";
import * as stripeService from "./stripe.service";
import * as shipping from "./shipping.service";
import { CreateOrderInput, FetchRatesInput } from "../schemas/order.schema";

const generateOrderNumber = () => `ORD-${nanoid(8).toUpperCase()}`;

const toOrderEmailData = (order: any): OrderEmailData => ({
  orderNumber: order.orderNumber,
  items: (order.items || []).map((i: OrderItem) => ({
    name: i.name,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    lineTotal: i.lineTotal,
  })),
  subtotal: order.subtotal,
  discountTotal: order.discountTotal,
  shippingFee: order.shippingFee,
  taxAmount: order.taxAmount,
  grandTotal: order.grandTotal,
  shippingAddress: order.shippingAddress,
  shipment: order.shipment,
});

const emailCustomer = async (
  order: any,
  subject: string,
  build: (firstName: string, data: OrderEmailData) => string,
) => {
  let customer = order.customer;
  if (!customer || typeof customer === "string" || !("email" in customer)) {
    customer = await UserModel.findById(order.customer).select(
      "firstName email",
    );
  }
  if (!customer?.email) return;
  await mailer.sendSafe(
    customer.email,
    subject,
    build(customer.firstName || "there", toOrderEmailData(order)),
  );
};

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

const adjustStock = async (items: OrderItem[], direction: 1 | -1) => {
  for (const item of items) {
    if (!item.product) continue;
    const product = await ProductModel.findById(item.product);
    if (!product) continue;

    if (item.variantId) {
      const variant = (product.variants as any).id(item.variantId);
      if (variant) {
        variant.quantity = Math.max(
          0,
          variant.quantity + direction * item.quantity,
        );
      }
    } else {
      product.quantity = Math.max(
        0,
        product.quantity + direction * item.quantity,
      );
    }
    await product.save();
  }
};

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
  const receiverName = r.fullName || `${r.firstName} ${r.lastName}`;
  return shipping.fetchRates({
    receiver: {
      name: receiverName,
      email: r.email || getOrFallbackEmail(),
      phone: r.phone || "08000000000",
      address: `${r.address}, ${r.city}, ${r.state}, ${r.country}`,
    },
    items: rateItems,
    country: r.country,
  });
};

const getOrFallbackEmail = () => "customer@edenhub.com";

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

    // Apply engraving only when the product offers it, using its configured fee.
    const eng = (product as any).engraving;
    const reqLines = ((line as any).engraving?.lines ?? [])
      .map((l: string) => (l ?? "").trim())
      .filter(Boolean);
    const engraving =
      eng?.available && reqLines.length > 0
        ? {
            font: (line as any).engraving?.font,
            lines: reqLines,
            fee: eng.fee ?? 0,
          }
        : undefined;

    const engravingFee = engraving?.fee ?? 0;
    const lineTotal = (unitPrice + engravingFee) * line.quantity;
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
      engraving,
    } as OrderItem);
  }

  const shippingFee = data.shippingFee ?? data.selectedCourier?.amount ?? 0;
  const discountTotal = data.discountTotal ?? 0;
  const taxAmount = data.taxAmount ?? 0;
  const grandTotal = Math.max(
    0,
    subtotal - discountTotal + shippingFee + taxAmount,
  );

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
          courierLogo: data.selectedCourier.courierLogo,
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

  const provider = data.paymentProvider || "paystack";
  order.paymentProvider = provider;

  try {
    const callbackUrl = `${getConfig("storefrontUrl")}/checkout/callback`;
    if (provider === "stripe") {
      const session = await stripeService.createCheckoutSession({
        email: customer.email,
        amount: grandTotal,
        reference: orderNumber,
        orderId: String(order._id),
        callbackUrl,
      });
      order.paymentReference = orderNumber;
      order.paymentAuthorizationUrl = session.url;
    } else {
      const init = await initializeTransaction({
        email: customer.email,
        amount: grandTotal,
        reference: orderNumber,
        metadata: {
          orderId: String(order._id),
          customerId: String(customer._id),
        },
        callbackUrl,
      });
      order.paymentReference = init.reference;
      order.paymentAuthorizationUrl = init.authorizationUrl;
    }
    await order.save();
  } catch (err) {
    log.error(err, `${provider} payment initialize failed; order left pending`);
  }

  await emailCustomer(
    { ...order.toObject(), customer },
    `Order ${orderNumber} confirmed`,
    OrderEmailTemplates.orderConfirmation,
  );

  return order.populate("customer", "firstName lastName email");
};

export interface OrderListQuery extends IPaginationQuery {
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  customer?: string;
  product?: string;
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
    product,
  } = query;

  const filter: FilterQuery<Order> = {};
  if (status && status !== "all") filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (product) filter["items.product"] = product;
  if (fulfillmentStatus) {
    // Accept a comma-separated list (e.g. "shipped,delivered") so a tab can
    // group several fulfillment states together.
    const statuses = fulfillmentStatus
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    filter.fulfillmentStatus =
      statuses.length > 1 ? { $in: statuses } : statuses[0];
  }
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

export const verifyCustomerPayment = async (userId: string, idOrRef: string) => {
  let order;
  try {
    order = await getCustomerOrderById(userId, idOrRef);
  } catch {
    const byNumber = await OrderModel.findOne({ orderNumber: idOrRef, customer: userId });
    if (!byNumber) throw new AppError("Order not found", 404);
    order = byNumber;
  }
  return verifyPayment(String(order._id));
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
              {
                $in: [
                  "$fulfillmentStatus",
                  ["fulfilled", "shipped", "delivered"],
                ],
              },
              1,
              0,
            ],
          },
        },
        unfulfilled: {
          // Orders genuinely awaiting fulfillment — exclude cancelled ones,
          // which need no action and shouldn't inflate the sidebar badge.
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$fulfillmentStatus", "unfulfilled"] },
                  { $ne: ["$status", "cancelled"] },
                ],
              },
              1,
              0,
            ],
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

  if (
    status === OrderStatus.Cancelled &&
    order.status !== OrderStatus.Cancelled
  ) {
    // Goods already in transit can't be cancelled — that's a return, not a
    // cancellation. Blocking this also prevents restoring phantom stock for
    // items that have physically left the warehouse.
    if (
      order.fulfillmentStatus === FulfillmentStatus.Shipped ||
      order.fulfillmentStatus === FulfillmentStatus.Delivered
    ) {
      throw new AppError(
        "This order has already been shipped or delivered and cannot be cancelled. Process a return/refund instead.",
        400,
      );
    }

    // Restore inventory once (item never left the warehouse).
    await adjustStock(order.items, 1);

    if (order.paymentStatus === PaymentStatus.Paid) {
      // The customer paid — refund their money so we don't keep it. If the
      // gateway refund fails, leave the payment as-is and flag for a manual
      // refund rather than wrongly marking it Refunded.
      if (order.paymentReference) {
        try {
          await refundTransaction({ reference: order.paymentReference });
          order.paymentStatus = PaymentStatus.Refunded;
          pushTimeline(order, "payment", "Refund issued on cancellation", by);
        } catch (err) {
          log.error(
            `Cancellation refund failed for ${order.orderNumber}: ${err}`,
          );
          pushTimeline(
            order,
            "payment",
            "Cancellation refund failed — manual refund required",
            by,
          );
          createAdminNotification({
            type: NotificationType.Payment,
            title: "Manual refund required",
            message: `${order.orderNumber} was cancelled but the refund failed`,
            link: `/admin/orders/${order._id}`,
          });
        }
      } else {
        order.paymentStatus = PaymentStatus.Refunded;
      }
    } else if (order.paymentStatus === PaymentStatus.Pending) {
      // Never paid — mark failed so the badge stays consistent (no lingering
      // "Pending" on a cancelled order).
      order.paymentStatus = PaymentStatus.Failed;
    }

    order.fulfillmentStatus = FulfillmentStatus.Unfulfilled;
  }

  order.status = status;
  pushTimeline(order, "status", `Order marked ${status}`, by);
  await order.save();

  if (status === OrderStatus.Cancelled) {
    await emailCustomer(
      order,
      `Order ${order.orderNumber} cancelled`,
      OrderEmailTemplates.orderCancelled,
    );
  }
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
    if (order.status === OrderStatus.Pending)
      order.status = OrderStatus.Processing;
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
    if (order.status === OrderStatus.Processing)
      order.status = OrderStatus.Completed;
  }
  pushTimeline(
    order,
    "fulfillment",
    `Fulfillment marked ${fulfillmentStatus}`,
    by,
  );
  await order.save();

  if (fulfillmentStatus === FulfillmentStatus.Delivered) {
    await emailCustomer(
      order,
      `Order ${order.orderNumber} delivered`,
      OrderEmailTemplates.orderDelivered,
    );
  }
  return order;
};

const applyPaidState = async (order: any) => {
  order.paymentStatus = PaymentStatus.Paid;
  order.paidAt = new Date();
  if (order.status === OrderStatus.Pending)
    order.status = OrderStatus.Processing;
  const provider = order.paymentProvider === "stripe" ? "Stripe" : "Paystack";
  pushTimeline(order, "payment", `Payment confirmed via ${provider}`);
  await order.save();

  createAdminNotification({
    type: NotificationType.Payment,
    title: "Payment received",
    message: `${order.orderNumber} · ₦${order.grandTotal.toLocaleString()}`,
    link: `/admin/orders/${order._id}`,
  });

  await emailCustomer(
    order,
    `Payment received for ${order.orderNumber}`,
    OrderEmailTemplates.paymentReceipt,
  );

  autoCreateShipment(order).catch((err) =>
    log.error(`Auto-shipment failed for ${order.orderNumber}: ${err}`),
  );
};

const autoCreateShipment = async (order: any) => {
  if (!order.shipment?.requestToken || !order.shipment?.serviceCode || !order.shipment?.courierId) {
    log.info(`${order.orderNumber}: no courier selected at checkout — skipping auto-ship`);
    return;
  }
  if (order.shipment?.shipbubbleOrderId) return;

  try {
    const label = await shipping.createLabel({
      requestToken: order.shipment.requestToken,
      serviceCode: order.shipment.serviceCode,
      courierId: order.shipment.courierId,
    });

    order.shipment.shipbubbleOrderId = label.shipbubbleOrderId;
    order.shipment.trackingNumber = label.trackingNumber;
    order.shipment.trackingUrl = label.trackingUrl;
    order.shipment.labelUrl = label.labelUrl;
    if (label.courier) order.shipment.courier = label.courier;
    order.shipment.shippedAt = new Date();
    order.fulfillmentStatus = FulfillmentStatus.Shipped;
    pushTimeline(order, "fulfillment", "Shipment auto-booked after payment");
    await order.save();

    createAdminNotification({
      type: NotificationType.Order,
      title: "Shipment auto-created",
      message: `${order.orderNumber} shipped via ${label.courier || "courier"}`,
      link: `/admin/orders/${order._id}`,
    });

    await emailCustomer(
      order,
      `Your order ${order.orderNumber} has shipped`,
      OrderEmailTemplates.orderShipped,
    );

    log.info(`Auto-shipped ${order.orderNumber} → ${label.trackingNumber || "no tracking"}`);
  } catch (err) {
    pushTimeline(order, "note", `Auto-shipment failed: ${(err as Error).message}`);
    await order.save();
    log.error(`Auto-shipment error for ${order.orderNumber}: ${err}`);
  }
};

const applyFailedState = async (
  order: any,
  reason: "failed" | "abandoned" = "failed",
) => {
  const abandoned = reason === "abandoned";
  order.paymentStatus = PaymentStatus.Failed;
  order.status = OrderStatus.Cancelled;
  order.fulfillmentStatus = FulfillmentStatus.Unfulfilled;
  pushTimeline(
    order,
    "payment",
    abandoned
      ? "Payment abandoned — order auto-cancelled, stock restored"
      : "Payment failed — order cancelled, stock restored",
  );
  await adjustStock(order.items, 1);
  await order.save();

  createAdminNotification({
    type: NotificationType.Payment,
    title: abandoned ? "Payment abandoned" : "Payment failed",
    message: `${order.orderNumber} — cancelled, stock restored`,
    link: `/admin/orders/${order._id}`,
  });

  await emailCustomer(
    order,
    abandoned
      ? `Your order ${order.orderNumber} was cancelled`
      : `Payment failed for ${order.orderNumber}`,
    OrderEmailTemplates.orderCancelled,
  );
};

export const verifyPayment = async (id: string) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  if (order.paymentStatus === PaymentStatus.Paid) return order;
  if (!order.paymentReference) {
    throw new AppError("Order has no payment reference to verify", 400);
  }

  if (order.paymentProvider === "stripe") {
    const result = await stripeService.verifyPaymentByReference(order.paymentReference);
    if (result.paid) {
      await applyPaidState(order);
    }
  } else {
    const result = await verifyTransaction(order.paymentReference);
    if (result.paid) {
      await applyPaidState(order);
    } else {
      await applyFailedState(order);
    }
  }
  return order;
};

export const handlePaystackWebhook = async (event: any) => {
  const reference = event?.data?.reference;
  if (!reference) return;

  const order = await OrderModel.findOne({ paymentReference: reference });
  if (!order) return;

  if (event?.event === "charge.success") {
    if (order.paymentStatus !== PaymentStatus.Paid) {
      await applyPaidState(order);
    }
  } else if (event?.event === "charge.failed") {
    if (
      order.paymentStatus !== PaymentStatus.Paid &&
      order.paymentStatus !== PaymentStatus.Failed
    ) {
      await applyFailedState(order);
    }
  }
};

export const handleStripeWebhook = async (event: any) => {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const reference = session.metadata?.reference;
    if (!reference) return;

    const order = await OrderModel.findOne({ paymentReference: reference });
    if (!order) return;

    if (session.payment_status === "paid" && order.paymentStatus !== PaymentStatus.Paid) {
      await applyPaidState(order);
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const reference = session.metadata?.reference;
    if (!reference) return;

    const order = await OrderModel.findOne({ paymentReference: reference });
    if (!order || order.paymentStatus === PaymentStatus.Paid) return;

    await applyFailedState(order, "abandoned");
  }
};

// Sweep orders stuck in `pending` payment past the abandonment window. For each,
// re-verify with Paystack one last time (in case a callback/webhook was missed),
// otherwise auto-cancel and restore stock so inventory isn't held indefinitely.
const ABANDON_AFTER_MINUTES = 30;

export const sweepAbandonedOrders = async () => {
  const cutoff = new Date(Date.now() - ABANDON_AFTER_MINUTES * 60 * 1000);
  const stale = await OrderModel.find({
    paymentStatus: PaymentStatus.Pending,
    status: { $ne: OrderStatus.Cancelled },
    createdAt: { $lt: cutoff },
  });

  let reconciled = 0;
  let cancelled = 0;

  for (const order of stale) {
    try {
      if (order.paymentReference) {
        const result = await verifyTransaction(order.paymentReference);
        if (result.paid) {
          await applyPaidState(order);
          reconciled += 1;
          continue;
        }
      }
      await applyFailedState(order, "abandoned");
      cancelled += 1;
    } catch (err) {
      log.error(`Failed to sweep abandoned order ${order.orderNumber}: ${err}`);
    }
  }

  if (stale.length) {
    log.info(
      `Abandoned-order sweep: ${stale.length} checked, ${reconciled} reconciled paid, ${cancelled} cancelled`,
    );
  }
  return { checked: stale.length, reconciled, cancelled };
};

// Admin-triggered, on-demand reconciliation of every pending-payment order.
// Unlike the scheduled sweep, this has no age cutoff — instead it trusts
// Paystack's reported status so an order the customer is still actively paying
// (status "ongoing"/"pending") is left untouched, while ones Paystack reports as
// failed/abandoned are cancelled and their stock restored immediately.
export const reconcilePendingPayments = async () => {
  const pending = await OrderModel.find({
    paymentStatus: PaymentStatus.Pending,
    status: { $ne: OrderStatus.Cancelled },
  });

  let paid = 0;
  let cancelled = 0;
  let untouched = 0;

  for (const order of pending) {
    try {
      if (!order.paymentReference) {
        await applyFailedState(order, "abandoned");
        cancelled += 1;
        continue;
      }
      const result = await verifyTransaction(order.paymentReference);
      if (result.paid) {
        await applyPaidState(order);
        paid += 1;
      } else if (["failed", "abandoned", "reversed"].includes(result.status)) {
        await applyFailedState(order, "abandoned");
        cancelled += 1;
      } else {
        untouched += 1;
      }
    } catch (err) {
      log.error(`Failed to reconcile order ${order.orderNumber}: ${err}`);
      untouched += 1;
    }
  }

  // Normalize orders that were already cancelled but left with a lingering
  // "pending" payment badge (e.g. cancelled manually before this fix). Stock
  // was already restored at cancellation, so only the badge is corrected here.
  const normalized = await OrderModel.updateMany(
    {
      status: OrderStatus.Cancelled,
      paymentStatus: PaymentStatus.Pending,
    },
    { $set: { paymentStatus: PaymentStatus.Failed } },
  );
  const fixed = normalized.modifiedCount ?? 0;
  cancelled += fixed;

  // A cancelled order that is still marked shipped/delivered is contradictory
  // (e.g. cancelled after dispatch before the cancel-guard existed). Treat the
  // goods as coming back: mark fulfillment "returned", which keeps the order
  // consistent with the stock that was restored at cancellation.
  const returned = await OrderModel.updateMany(
    {
      status: OrderStatus.Cancelled,
      fulfillmentStatus: {
        $in: [FulfillmentStatus.Shipped, FulfillmentStatus.Delivered],
      },
    },
    { $set: { fulfillmentStatus: FulfillmentStatus.Returned } },
  );
  const returnedFixed = returned.modifiedCount ?? 0;

  return {
    checked: pending.length + fixed + returnedFixed,
    paid,
    cancelled: cancelled + returnedFixed,
    untouched,
  };
};

export const refundOrder = async (id: string, amount?: number, by?: string) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  if (order.paymentStatus !== PaymentStatus.Paid) {
    throw new AppError("Only a paid order can be refunded", 400);
  }
  if (!order.paymentReference) {
    throw new AppError("Order has no payment to refund", 400);
  }

  await refundTransaction({ reference: order.paymentReference, amount });

  order.paymentStatus = PaymentStatus.Refunded;
  // Only restore stock when the order is still live. A cancelled order already
  // had its stock restored at cancellation, so restoring again would
  // double-count inventory.
  if (order.status !== OrderStatus.Cancelled) {
    await adjustStock(order.items, 1);
  }
  pushTimeline(
    order,
    "payment",
    amount ? `Refunded ₦${amount}` : "Full refund issued",
    by,
  );
  await order.save();

  await emailCustomer(
    order,
    `Refund issued for ${order.orderNumber}`,
    (firstName, data) =>
      OrderEmailTemplates.refundIssued(firstName, data, amount),
  );
  return order;
};

export const cancelOrder = async (id: string, by?: string) => {
  return updateOrderStatus(id, OrderStatus.Cancelled, by);
};

export const customerCancelOrder = async (userId: string, orderId: string, reason?: string) => {
  const order = await OrderModel.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  const ownerId = typeof (order.customer as any)?._id !== "undefined"
    ? String((order.customer as any)._id)
    : String(order.customer);
  if (ownerId !== userId) throw new AppError("Order not found", 404);

  if (order.fulfillmentStatus === FulfillmentStatus.Shipped ||
      order.fulfillmentStatus === FulfillmentStatus.Delivered) {
    throw new AppError("Cannot cancel a shipped or delivered order. Open a dispute instead.", 400);
  }

  if (order.status === OrderStatus.Cancelled) {
    throw new AppError("Order is already cancelled", 400);
  }

  if (order.shipment?.shipbubbleOrderId) {
    try {
      await shipping.cancelShipment(order.shipment.shipbubbleOrderId);
      pushTimeline(order, "fulfillment", "Shipment cancelled");
    } catch (err) {
      log.error(`Failed to cancel Shipbubble shipment for ${order.orderNumber}: ${err}`);
    }
  }

  order.status = OrderStatus.Cancelled;
  order.fulfillmentStatus = FulfillmentStatus.Unfulfilled;
  pushTimeline(order, "status", reason ? `Cancelled by customer: ${reason}` : "Cancelled by customer");
  await adjustStock(order.items, 1);
  await order.save();

  createAdminNotification({
    type: NotificationType.Order,
    title: "Order cancelled by customer",
    message: `${order.orderNumber}${reason ? ` — ${reason}` : ""}`,
    link: `/admin/orders/${order._id}`,
  });

  await emailCustomer(order, `Order ${order.orderNumber} cancelled`, OrderEmailTemplates.orderCancelled);

  return order;
};

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

  await emailCustomer(
    order,
    `Your order ${order.orderNumber} has shipped`,
    OrderEmailTemplates.orderShipped,
  );
  return order;
};

export const trackOrder = async (id: string) => {
  const order = await OrderModel.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  if (!order.shipment?.shipbubbleOrderId) {
    throw new AppError("Order has no shipment to track", 400);
  }

  const tracking = await shipping.trackShipment(
    order.shipment.shipbubbleOrderId,
  );

  const status = String(tracking?.status || "").toLowerCase();
  if (
    status.includes("deliver") &&
    order.fulfillmentStatus !== FulfillmentStatus.Delivered
  ) {
    order.fulfillmentStatus = FulfillmentStatus.Delivered;
    order.shipment.deliveredAt = new Date();
    if (order.status === OrderStatus.Processing)
      order.status = OrderStatus.Completed;
    await order.save();
    await emailCustomer(
      order,
      `Order ${order.orderNumber} delivered`,
      OrderEmailTemplates.orderDelivered,
    );
  }

  return { order, tracking };
};

export const pollShippedOrderTracking = async () => {
  const shipped = await OrderModel.find({
    fulfillmentStatus: FulfillmentStatus.Shipped,
    "shipment.shipbubbleOrderId": { $exists: true, $ne: "" },
  });

  if (shipped.length === 0) return { checked: 0, updated: 0 };

  let updated = 0;
  for (const order of shipped) {
    try {
      const tracking = await shipping.trackShipment(order.shipment.shipbubbleOrderId!);
      const status = String(tracking?.status || "").toLowerCase();

      if (status.includes("deliver") && order.fulfillmentStatus !== FulfillmentStatus.Delivered) {
        order.fulfillmentStatus = FulfillmentStatus.Delivered;
        order.shipment.deliveredAt = new Date();
        if (order.status === OrderStatus.Processing) order.status = OrderStatus.Completed;
        pushTimeline(order, "fulfillment", "Delivered — confirmed by carrier tracking");
        await order.save();

        await emailCustomer(order, `Order ${order.orderNumber} delivered`, OrderEmailTemplates.orderDelivered);

        createAdminNotification({
          type: NotificationType.Order,
          title: "Order delivered",
          message: `${order.orderNumber} confirmed delivered`,
          link: `/admin/orders/${order._id}`,
        });

        updated++;
      } else if (tracking?.tracking_number && !order.shipment.trackingNumber) {
        order.shipment.trackingNumber = tracking.tracking_number;
        if (tracking.tracking_url) order.shipment.trackingUrl = tracking.tracking_url;
        await order.save();
      }
    } catch (err) {
      log.error(`Tracking poll failed for ${order.orderNumber}: ${err}`);
    }
  }

  if (shipped.length > 0) {
    log.info(`Tracking poll: ${shipped.length} checked, ${updated} delivered`);
  }
  return { checked: shipped.length, updated };
};
