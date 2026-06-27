import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as orderService from "../services/order.service";
import { verifyWebhookSignature } from "../services/payment.service";
import * as stripeService from "../services/stripe.service";
import {
  getPaginationMetadata,
  IPaginationQuery,
} from "../utils/pagination.utils";
import log from "../utils/logger";

export const fetchRatesHandler = catchAsync(
  async (req: Request, res: Response) => {
    const rates = await orderService.getRates(req.body);
    res.status(200).json({
      status: "success",
      message: "Shipping rates retrieved successfully",
      data: rates,
    });
  },
);

export const createOrderHandler = catchAsync(
  async (req: Request, res: Response) => {
    const order = await orderService.createOrder({
      ...req.body,
      customer: req.user!.id,
    });
    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      data: order,
    });
  },
);

export const getMyOrdersHandler = catchAsync(
  async (req: Request, res: Response) => {
    const base: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      searchTerm: req.query.searchTerm as string,
    };

    const { orders, totalCount } = await orderService.getCustomerOrders(
      req.user!.id,
      { ...base, status: req.query.status as string },
    );

    const metadata = getPaginationMetadata(
      totalCount,
      base.pageNumber,
      base.pageSize,
    );

    res.status(200).json({
      status: "success",
      message: "Orders retrieved successfully",
      data: { data: orders, metadata },
    });
  },
);

export const getMyOrderHandler = catchAsync(
  async (req: Request, res: Response) => {
    const order = await orderService.getCustomerOrderById(
      req.user!.id,
      req.params.id,
    );
    res.status(200).json({ status: "success", data: order });
  },
);

export const verifyMyOrderHandler = catchAsync(
  async (req: Request, res: Response) => {
    const order = await orderService.verifyCustomerPayment(
      req.user!.id,
      req.params.id,
    );
    res.status(200).json({
      status: "success",
      message: "Payment verified",
      data: order,
    });
  },
);

export const cancelMyOrderHandler = catchAsync(
  async (req: Request, res: Response) => {
    const order = await orderService.customerCancelOrder(
      req.user!.id,
      req.params.id,
      req.body.reason,
    );
    res.status(200).json({ status: "success", message: "Order cancelled", data: order });
  },
);

export const getOrdersHandler = catchAsync(
  async (req: Request, res: Response) => {
    const base: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      searchTerm: req.query.searchTerm as string,
      orderBy: req.query.orderBy as string,
    };

    const { orders, totalCount } = await orderService.getAllOrders({
      ...base,
      status: req.query.status as string,
      paymentStatus: req.query.paymentStatus as string,
      fulfillmentStatus: req.query.fulfillmentStatus as string,
      customer: req.query.customer as string,
      product: req.query.product as string,
    });

    const metadata = getPaginationMetadata(
      totalCount,
      base.pageNumber,
      base.pageSize,
    );

    res.status(200).json({
      status: "success",
      message: "Orders retrieved successfully",
      data: { data: orders, metadata },
    });
  },
);

export const getOrderStatsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const stats = await orderService.getOrderStats();
    res.status(200).json({
      status: "success",
      message: "Order stats retrieved successfully",
      data: stats,
    });
  },
);

export const reconcilePendingHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await orderService.reconcilePendingPayments();
    res.status(200).json({
      status: "success",
      message: `Reconciled ${result.checked} pending order(s): ${result.paid} paid, ${result.cancelled} cancelled, ${result.untouched} still awaiting payment`,
      data: result,
    });
  },
);

export const getOrderByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const order = await orderService.getOrderById(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Order retrieved successfully",
      data: order,
    });
  },
);

export const updateStatusHandler = catchAsync(
  async (req: Request, res: Response) => {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status,
      req.user?.id,
    );
    res.status(200).json({ status: "success", data: order });
  },
);

export const updatePaymentHandler = catchAsync(
  async (req: Request, res: Response) => {
    const order = await orderService.updatePaymentStatus(
      req.params.id,
      req.body.paymentStatus,
      req.user?.id,
    );
    res.status(200).json({ status: "success", data: order });
  },
);

export const updateFulfillmentHandler = catchAsync(
  async (req: Request, res: Response) => {
    const order = await orderService.updateFulfillmentStatus(
      req.params.id,
      req.body.fulfillmentStatus,
      req.user?.id,
    );
    res.status(200).json({ status: "success", data: order });
  },
);

export const verifyPaymentHandler = catchAsync(
  async (req: Request, res: Response) => {
    const order = await orderService.verifyPayment(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Payment verified",
      data: order,
    });
  },
);

export const refundOrderHandler = catchAsync(
  async (req: Request, res: Response) => {
    const order = await orderService.refundOrder(
      req.params.id,
      req.body.amount,
      req.user?.id,
    );
    res.status(200).json({
      status: "success",
      message: "Refund processed",
      data: order,
    });
  },
);

export const cancelOrderHandler = catchAsync(
  async (req: Request, res: Response) => {
    const order = await orderService.cancelOrder(req.params.id, req.user?.id);
    res.status(200).json({
      status: "success",
      message: "Order cancelled",
      data: order,
    });
  },
);

export const shipOrderHandler = catchAsync(
  async (req: Request, res: Response) => {
    const order = await orderService.shipOrder(
      req.params.id,
      req.body,
      req.user?.id,
    );
    res.status(200).json({
      status: "success",
      message: "Shipment booked",
      data: order,
    });
  },
);

export const trackOrderHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await orderService.trackOrder(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Tracking refreshed",
      data: result,
    });
  },
);

// Public, raw-body Paystack webhook (mounted before the JSON parser).
export const paystackWebhookHandler = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-paystack-signature"] as string | undefined;
    const raw = req.body as Buffer;

    if (!verifyWebhookSignature(raw, signature)) {
      return res.sendStatus(401);
    }

    const event = JSON.parse(raw.toString("utf8"));
    res.sendStatus(200);
    orderService
      .handlePaystackWebhook(event)
      .catch((err) => log.error(err, "Paystack webhook processing failed"));
  } catch (err) {
    log.error(err, "Paystack webhook error");
    if (!res.headersSent) res.sendStatus(400);
  }
};

// Public, raw-body Stripe webhook (mounted before the JSON parser).
export const stripeWebhookHandler = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string;
    const raw = req.body as Buffer;

    const event = stripeService.constructWebhookEvent(raw, signature);
    res.sendStatus(200);
    orderService
      .handleStripeWebhook(event)
      .catch((err) => log.error(err, "Stripe webhook processing failed"));
  } catch (err) {
    log.error(err, "Stripe webhook error");
    if (!res.headersSent) res.sendStatus(400);
  }
};
