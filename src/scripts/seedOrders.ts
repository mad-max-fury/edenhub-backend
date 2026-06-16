/**
 * Seed demo orders for the first customer so the storefront account screens
 * (My Orders, Product Reviews) and admin order views have data to show.
 *
 * Run from the backend root:  npx ts-node src/scripts/seedOrders.ts
 *
 * Creates a mix of statuses (delivered / shipped / pending). Delivered orders
 * make their products eligible to review. This does NOT touch stock or call
 * Paystack/Shipbubble — it inserts orders directly.
 */
import { nanoid } from "nanoid";
import connectDocumentDB from "../db/connect";
import OrderModel, {
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
} from "../models/order.model";
import ProductModel from "../models/product.model";
import UserModel from "../models/user.model";
import { findRoleByName } from "../services/role.service";
import log from "../utils/logger";

const orderNo = () => `ORD-${nanoid(8).toUpperCase()}`;

const buildItem = (product: any, quantity: number) => {
  const unitPrice = product.discount?.price || product.basePrice;
  return {
    product: product._id,
    name: product.name,
    sku: product.variants?.[0]?.sku,
    image: product.coverImage || product.images?.[0],
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
    attributes: {},
  };
};

const makeOrder = (
  customerId: any,
  items: any[],
  status: OrderStatus,
  paymentStatus: PaymentStatus,
  fulfillmentStatus: FulfillmentStatus,
) => {
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const shippingFee = 2500;
  const grandTotal = subtotal + shippingFee;
  return {
    orderNumber: orderNo(),
    customer: customerId,
    items,
    subtotal,
    discountTotal: 0,
    shippingFee,
    taxAmount: 0,
    grandTotal,
    currency: "NGN",
    status,
    paymentStatus,
    fulfillmentStatus,
    paymentProvider: "paystack",
    paymentReference: orderNo(),
    paidAt: paymentStatus === PaymentStatus.Paid ? new Date() : undefined,
    shippingAddress: {
      fullName: "Prince Chijioke",
      phone: "+2349038283447",
      address: "4517 Washington Ave, Manchester",
      city: "Lekki",
      state: "Lagos",
      country: "Nigeria",
    },
    shipment:
      fulfillmentStatus === FulfillmentStatus.Shipped ||
      fulfillmentStatus === FulfillmentStatus.Delivered
        ? {
            courier: "GIG Logistics",
            trackingNumber: `EWH${nanoid(6).toUpperCase()}`,
            trackingUrl: "https://shipbubble.com/tracking",
            shippedAt: new Date(),
            deliveredAt:
              fulfillmentStatus === FulfillmentStatus.Delivered
                ? new Date()
                : undefined,
          }
        : {},
    timeline: [
      { type: "status", message: "Order created", at: new Date() },
      ...(paymentStatus === PaymentStatus.Paid
        ? [{ type: "payment", message: "Payment confirmed", at: new Date() }]
        : []),
    ],
  };
};

const run = async () => {
  await connectDocumentDB();

  const customerRole = await findRoleByName("customer");
  const customer = await UserModel.findOne(
    customerRole?._id ? { role: customerRole._id } : {},
  ).sort("createdAt");

  if (!customer) {
    log.error("No customer user found. Create a customer account first.");
    process.exit(1);
  }

  const products = await ProductModel.find({ status: "active" }).limit(5);
  if (products.length === 0) {
    log.error("No active products found. Import products first.");
    process.exit(1);
  }

  const p = (i: number) => products[i % products.length];

  const orders = [
    makeOrder(
      customer._id,
      [buildItem(p(0), 1), buildItem(p(1), 2)],
      OrderStatus.Completed,
      PaymentStatus.Paid,
      FulfillmentStatus.Delivered,
    ),
    makeOrder(
      customer._id,
      [buildItem(p(2), 1)],
      OrderStatus.Completed,
      PaymentStatus.Paid,
      FulfillmentStatus.Delivered,
    ),
    makeOrder(
      customer._id,
      [buildItem(p(3), 1)],
      OrderStatus.Processing,
      PaymentStatus.Paid,
      FulfillmentStatus.Shipped,
    ),
    makeOrder(
      customer._id,
      [buildItem(p(0), 1)],
      OrderStatus.Pending,
      PaymentStatus.Pending,
      FulfillmentStatus.Unfulfilled,
    ),
  ];

  await OrderModel.insertMany(orders);
  log.info(
    `Seeded ${orders.length} orders for ${customer.email} (2 delivered → reviewable).`,
  );
  process.exit(0);
};

run().catch((err) => {
  log.error(err, "Order seed failed");
  process.exit(1);
});
