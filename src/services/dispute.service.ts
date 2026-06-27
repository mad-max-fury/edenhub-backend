import { DisputeModel, DisputeStatus, DisputeType } from "../models/dispute.model";
import OrderModel, { PaymentStatus, FulfillmentStatus } from "../models/order.model";
import AppError from "../errors/appError";
import { IPaginationQuery } from "../utils/pagination.utils";
import { refundTransaction } from "./payment.service";
import { createAdminNotification } from "./notification.service";
import { NotificationType } from "../models/notification.model";
import log from "../utils/logger";

const POPULATE = [
  { path: "customer", select: "firstName lastName email" },
  { path: "order", select: "orderNumber grandTotal paymentStatus fulfillmentStatus paymentReference paymentProvider" },
  { path: "messages.senderId", select: "firstName lastName" },
  { path: "resolvedBy", select: "firstName lastName" },
];

export const createDispute = async (
  customerId: string,
  orderId: string,
  data: { type: DisputeType; reason: string; description?: string; images?: string[] },
) => {
  const order = await OrderModel.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (String(order.customer) !== customerId) throw new AppError("Not your order", 403);

  const existing = await DisputeModel.findOne({
    order: orderId,
    status: { $nin: [DisputeStatus.Resolved, DisputeStatus.Rejected] },
  });
  if (existing) throw new AppError("An open dispute already exists for this order", 400);

  const dispute = await DisputeModel.create({
    customer: customerId,
    order: orderId,
    type: data.type,
    reason: data.reason,
    description: data.description,
    images: data.images || [],
    messages: [{
      sender: "customer",
      senderId: customerId,
      body: data.description || data.reason,
      images: data.images || [],
    }],
  });

  createAdminNotification({
    type: NotificationType.Order,
    title: "New dispute opened",
    message: `${order.orderNumber} — ${data.type}: ${data.reason}`,
    link: `/admin/orders/${orderId}`,
    meta: { orderId: String(orderId) },
  });

  return dispute.populate(POPULATE);
};

export const getCustomerDisputes = async (customerId: string, query: IPaginationQuery) => {
  const filter = { customer: customerId };
  const totalCount = await DisputeModel.countDocuments(filter);
  const disputes = await DisputeModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((query.pageNumber - 1) * query.pageSize)
    .limit(query.pageSize)
    .populate(POPULATE)
    .lean();
  return { disputes, totalCount };
};

export const getAllDisputes = async (query: IPaginationQuery & { status?: string }) => {
  const filter: Record<string, unknown> = {};
  if (query.status && query.status !== "all") filter.status = query.status;
  const totalCount = await DisputeModel.countDocuments(filter);
  const disputes = await DisputeModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((query.pageNumber - 1) * query.pageSize)
    .limit(query.pageSize)
    .populate(POPULATE)
    .lean();
  return { disputes, totalCount };
};

export const getDisputeById = async (id: string) => {
  return DisputeModel.findById(id).populate(POPULATE).lean();
};

export const addDisputeMessage = async (
  disputeId: string,
  sender: "customer" | "admin",
  senderId: string,
  body: string,
  images?: string[],
) => {
  const dispute = await DisputeModel.findById(disputeId);
  if (!dispute) throw new AppError("Dispute not found", 404);
  if (dispute.status === DisputeStatus.Resolved || dispute.status === DisputeStatus.Refunded) {
    throw new AppError("This dispute is already resolved", 400);
  }

  dispute.messages.push({ sender, senderId: senderId as any, body, images: images || [], createdAt: new Date() });
  await dispute.save();
  return dispute.populate(POPULATE);
};

export const updateDisputeStatus = async (
  disputeId: string,
  adminId: string,
  status: DisputeStatus,
  resolution?: string,
) => {
  const dispute = await DisputeModel.findById(disputeId);
  if (!dispute) throw new AppError("Dispute not found", 404);

  dispute.status = status;
  if (resolution) dispute.resolution = resolution;
  if (status === DisputeStatus.Resolved || status === DisputeStatus.Rejected || status === DisputeStatus.Refunded) {
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = adminId as any;
  }
  await dispute.save();
  return dispute.populate(POPULATE);
};

export const processRefund = async (disputeId: string, adminId: string, amount?: number) => {
  const dispute = await DisputeModel.findById(disputeId).populate("order");
  if (!dispute) throw new AppError("Dispute not found", 404);

  const order = dispute.order as any;
  if (!order) throw new AppError("Order not found", 404);
  if (order.paymentStatus !== PaymentStatus.Paid) throw new AppError("Order is not paid", 400);

  const refundAmt = amount ?? order.grandTotal;

  try {
    if (order.paymentProvider === "paystack" && order.paymentReference) {
      await refundTransaction({ reference: order.paymentReference, amount: amount });
    }
  } catch (err) {
    log.error(err, "Refund via payment provider failed — marking as refunded anyway");
  }

  order.paymentStatus = PaymentStatus.Refunded;
  order.fulfillmentStatus = FulfillmentStatus.Returned;
  await order.save();

  dispute.status = DisputeStatus.Refunded;
  dispute.refundAmount = refundAmt;
  dispute.resolvedAt = new Date();
  dispute.resolvedBy = adminId as any;
  dispute.resolution = `Refunded ₦${refundAmt.toLocaleString()}`;
  await dispute.save();

  return dispute.populate(POPULATE);
};
