/**
 * Seed a customer user + an order for them.
 *
 *   npx ts-node --transpile-only scripts/seedCustomerOrder.ts
 *
 * Idempotent: re-running reuses the customer and only creates an order if they
 * don't already have one.
 */
import dotenv from "dotenv";
dotenv.config();

import { connect, disconnect } from "mongoose";
import { nanoid } from "nanoid";
import { getConfig } from "../src/config";
import UserModel from "../src/models/user.model";
import ProductModel from "../src/models/product.model";
import OrderModel, {
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
} from "../src/models/order.model";
import { findRoleByName } from "../src/services/role.service";

const CUSTOMER = {
  firstName: "Ada",
  lastName: "Obi",
  email: "ada.customer@yopmail.com",
  password: "Password123!",
  phoneNumber: "08031234567",
  city: "Lagos",
  state: "Lagos",
  country: "Nigeria",
};

async function main() {
  await connect(getConfig("dbUri"));
  console.log("Connected.\n");

  // 1) Customer role (auto-seeded by the role system).
  const customerRole = await findRoleByName("customer");
  if (!customerRole) {
    throw new Error(
      'No "customer" role found. Start the backend once to seed roles, then re-run.',
    );
  }

  // 2) Create or reuse the customer.
  let customer = await UserModel.findOne({ email: CUSTOMER.email });
  if (!customer) {
    // UserModel.create triggers the argon2 password-hash pre-save hook.
    customer = await UserModel.create({
      ...CUSTOMER,
      role: customerRole._id,
      isVerified: true,
      isActive: true,
    });
    console.log(`✓ Created customer ${customer.email} (${customer._id})`);
  } else {
    console.log(`• Customer already exists: ${customer.email} (${customer._id})`);
  }

  // 3) Skip if they already have an order.
  const existing = await OrderModel.findOne({ customer: customer._id });
  if (existing) {
    console.log(`• Customer already has order ${existing.orderNumber}; nothing to do.`);
    await disconnect();
    return;
  }

  // 4) Build items from real products when available, else a snapshot.
  const products = await ProductModel.find().limit(2).select("name coverImage basePrice variants");
  const items =
    products.length > 0
      ? products.map((p, i) => {
          const qty = i + 1;
          const unitPrice = p.basePrice || 25000;
          return {
            product: p._id,
            name: p.name,
            image:
              p.coverImage ||
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
            unitPrice,
            quantity: qty,
            lineTotal: unitPrice * qty,
            attributes: {},
          };
        })
      : [
          {
            name: "Aviator Sunglasses - Gold",
            image:
              "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
            unitPrice: 45000,
            quantity: 1,
            lineTotal: 45000,
            attributes: {},
          },
          {
            name: "Leather Strap Watch",
            image:
              "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400",
            unitPrice: 80000,
            quantity: 2,
            lineTotal: 160000,
            attributes: {},
          },
        ];

  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
  const shippingFee = 2500;
  const grandTotal = subtotal + shippingFee;
  const orderNumber = `ORD-${nanoid(8).toUpperCase()}`;
  const now = new Date();

  // 5) Create a realistic PAID order (shows up in revenue/analytics).
  const order = await OrderModel.create({
    orderNumber,
    customer: customer._id,
    items,
    subtotal,
    shippingFee,
    grandTotal,
    status: OrderStatus.Processing,
    paymentStatus: PaymentStatus.Paid,
    fulfillmentStatus: FulfillmentStatus.Unfulfilled,
    paymentReference: orderNumber,
    paidAt: now,
    shippingAddress: {
      fullName: `${customer.firstName} ${customer.lastName}`,
      phone: customer.phoneNumber,
      email: customer.email,
      address: "12 Marina Road",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
    },
    timeline: [
      { type: "status", message: "Order created", at: now },
      { type: "payment", message: "Payment confirmed via Paystack", at: now },
    ],
  });

  console.log(
    `✓ Created order ${order.orderNumber} — ${items.length} item(s), ₦${grandTotal.toLocaleString()} (paid)`,
  );
  console.log(`\nDone. Customer login: ${CUSTOMER.email} / ${CUSTOMER.password}\n`);

  await disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await disconnect();
  process.exit(1);
});
