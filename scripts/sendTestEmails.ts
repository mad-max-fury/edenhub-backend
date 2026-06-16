/**
 * Verify every transactional email template.
 *
 *   Compile-only (default — no SMTP needed):
 *     npx ts-node --transpile-only scripts/sendTestEmails.ts
 *
 *   Also deliver each one to a real inbox:
 *     TEST_EMAIL=you@example.com npx ts-node --transpile-only scripts/sendTestEmails.ts
 *
 * Compile-only proves each MJML template renders to HTML. Supplying TEST_EMAIL
 * additionally pushes every message through the configured transport so you can
 * confirm end-to-end delivery.
 */
import dotenv from "dotenv";
dotenv.config();

import { mailer } from "../src/utils/mailer.utils";
import { AuthEmailTemplates } from "../src/templates/authEmail.templates";
import {
  OrderEmailData,
  OrderEmailTemplates,
} from "../src/templates/orderEmail.templates";

const NAME = "Ada";

const sampleOrder: OrderEmailData = {
  orderNumber: "ORD-TEST1234",
  items: [
    { name: "Aviator Sunglasses - Gold", quantity: 1, unitPrice: 45000, lineTotal: 45000 },
    { name: "Leather Strap Watch", quantity: 2, unitPrice: 80000, lineTotal: 160000 },
  ],
  subtotal: 205000,
  discountTotal: 5000,
  shippingFee: 3500,
  taxAmount: 0,
  grandTotal: 203500,
  shippingAddress: {
    fullName: "Ada Obi",
    address: "12 Marina Road",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
  },
  shipment: {
    courier: "DHL Express",
    trackingNumber: "DHL-998877",
    trackingUrl: "https://track.example.com/DHL-998877",
  },
};

// [label, subject, mjml] for every template we ship.
const templates: Array<[string, string, string]> = [
  ["auth.welcome", "Welcome to EdenHub", AuthEmailTemplates.welcome(NAME)],
  ["auth.verification", "Verify your account", AuthEmailTemplates.verification(NAME, "482913")],
  ["auth.twoFactorCode", "Your verification code", AuthEmailTemplates.twoFactorCode(NAME, "482913")],
  ["auth.forgotPassword", "Reset your password", AuthEmailTemplates.forgotPassword(NAME, "482913")],
  ["auth.resetPasswordConfirmation", "Password reset", AuthEmailTemplates.resetPasswordConfirmation(NAME)],
  ["auth.passwordChanged", "Password changed", AuthEmailTemplates.passwordChanged(NAME)],
  [
    "auth.loginAlert",
    "New login detected",
    AuthEmailTemplates.loginAlert(NAME, {
      ip: "102.89.1.1",
      device: "Chrome on macOS",
      time: new Date().toLocaleString(),
    }),
  ],
  [
    "auth.staffInvite",
    "Your staff account",
    AuthEmailTemplates.staffInvite(NAME, {
      email: "ada@edenhub.com",
      password: "Temp#2026",
      staffId: "EDN-0007",
      role: "Operations Manager",
    }),
  ],
  ["order.orderConfirmation", "Order confirmed", OrderEmailTemplates.orderConfirmation(NAME, sampleOrder)],
  ["order.paymentReceipt", "Payment received", OrderEmailTemplates.paymentReceipt(NAME, sampleOrder)],
  ["order.orderShipped", "Your order shipped", OrderEmailTemplates.orderShipped(NAME, sampleOrder)],
  ["order.orderDelivered", "Order delivered", OrderEmailTemplates.orderDelivered(NAME, sampleOrder)],
  ["order.orderCancelled", "Order cancelled", OrderEmailTemplates.orderCancelled(NAME, sampleOrder)],
  ["order.refundIssued", "Refund issued", OrderEmailTemplates.refundIssued(NAME, sampleOrder, 50000)],
];

async function main() {
  const to = process.env.TEST_EMAIL;
  let failures = 0;

  console.log(`\nVerifying ${templates.length} email templates...\n`);

  for (const [label, subject, mjml] of templates) {
    try {
      const html = mailer.renderHtml(mjml);
      if (!html || html.length < 100) {
        throw new Error("compiled HTML is suspiciously empty");
      }
      if (to) {
        await mailer.send(to, `[TEST] ${subject}`, mjml);
        console.log(`  ✓ ${label.padEnd(32)} compiled + sent to ${to}`);
      } else {
        console.log(`  ✓ ${label.padEnd(32)} compiled (${html.length} bytes)`);
      }
    } catch (err: any) {
      failures += 1;
      console.error(`  ✗ ${label.padEnd(32)} ${err?.message || err}`);
    }
  }

  console.log(
    `\n${templates.length - failures}/${templates.length} templates OK` +
      (to ? ` — delivered to ${to}` : " (compile-only; set TEST_EMAIL to send)") +
      "\n",
  );
  process.exit(failures ? 1 : 0);
}

main();
