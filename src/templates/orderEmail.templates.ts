import {
  emailButton,
  emailColors,
  naira,
  renderEmailLayout,
} from "./emailLayout";

export interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderEmailData {
  orderNumber: string;
  items: OrderEmailItem[];
  subtotal: number;
  discountTotal?: number;
  shippingFee?: number;
  taxAmount?: number;
  grandTotal: number;
  shippingAddress?: {
    fullName?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  shipment?: {
    courier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
}

const storefront = () => process.env.STOREFRONT_URL || "https://edenhub.com";

const orderUrl = (orderNumber: string) =>
  `${storefront()}/c/account/orders`;

// Renders the line-items + totals block shared by most order emails.
const summaryBlock = (order: OrderEmailData): string => {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${emailColors.line};font-size:13px;color:${emailColors.text}">
          ${item.name} <span style="color:${emailColors.gray}">× ${item.quantity}</span>
        </td>
        <td align="right" style="padding:8px 0;border-bottom:1px solid ${emailColors.line};font-size:13px;color:${emailColors.text};white-space:nowrap">
          ${naira(item.lineTotal)}
        </td>
      </tr>`,
    )
    .join("");

  const totalLine = (label: string, value: string, bold = false) => `
    <tr>
      <td style="padding:4px 0;font-size:13px;color:${emailColors.gray}${
        bold ? `;font-weight:700;color:${emailColors.text};font-size:15px` : ""
      }">${label}</td>
      <td align="right" style="padding:4px 0;font-size:13px;color:${emailColors.text}${
        bold ? ";font-weight:700;font-size:15px" : ""
      }">${value}</td>
    </tr>`;

  return `
  <mj-raw>
    <table width="100%" style="border-collapse:collapse;margin:16px 0">
      <thead>
        <tr>
          <th align="left" style="padding-bottom:6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${emailColors.gray}">Item</th>
          <th align="right" style="padding-bottom:6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${emailColors.gray}">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <table width="100%" style="border-collapse:collapse;margin-top:8px">
      ${totalLine("Subtotal", naira(order.subtotal))}
      ${order.discountTotal ? totalLine("Discount", `- ${naira(order.discountTotal)}`) : ""}
      ${totalLine("Shipping", naira(order.shippingFee || 0))}
      ${order.taxAmount ? totalLine("Tax", naira(order.taxAmount)) : ""}
      ${totalLine("Total", naira(order.grandTotal), true)}
    </table>
  </mj-raw>`;
};

const addressBlock = (order: OrderEmailData): string => {
  const a = order.shippingAddress;
  if (!a) return "";
  return `
    <mj-text font-size="12px" color="${emailColors.gray}" padding-top="14px">
      <strong style="color:${emailColors.text}">Shipping to</strong><br/>
      ${a.fullName || ""}<br/>
      ${[a.address, a.city, a.state, a.country].filter(Boolean).join(", ")}
    </mj-text>`;
};

export class OrderEmailTemplates {
  private static readonly colors = emailColors;

  // Order placed — awaiting / confirming payment.
  public static orderConfirmation(name: string, order: OrderEmailData): string {
    return renderEmailLayout(
      `
      <mj-text font-size="14px" line-height="26px">Thanks for your order! We've received order <strong>${order.orderNumber}</strong> and will let you know as soon as it ships.</mj-text>
      ${summaryBlock(order)}
      ${addressBlock(order)}
      ${emailButton("View your order", orderUrl(order.orderNumber))}
    `,
      name,
    );
  }

  // Payment confirmed.
  public static paymentReceipt(name: string, order: OrderEmailData): string {
    return renderEmailLayout(
      `
      <mj-text font-size="14px" line-height="26px">We've received your payment for order <strong>${order.orderNumber}</strong>. Here's your receipt.</mj-text>
      <mj-text font-size="20px" color="${this.colors.success}" font-weight="700" align="center" padding="14px 0">${naira(order.grandTotal)} paid</mj-text>
      ${summaryBlock(order)}
      ${emailButton("View your order", orderUrl(order.orderNumber))}
    `,
      name,
    );
  }

  // Shipment booked / on the way.
  public static orderShipped(name: string, order: OrderEmailData): string {
    const s = order.shipment || {};
    const tracking = s.trackingNumber
      ? `
      <mj-text font-size="13px" line-height="22px" padding-top="10px">
        <strong>Courier:</strong> ${s.courier || "—"}<br/>
        <strong>Tracking number:</strong> ${s.trackingNumber}
      </mj-text>`
      : "";
    const cta = s.trackingUrl
      ? emailButton("Track your package", s.trackingUrl)
      : emailButton("View your order", orderUrl(order.orderNumber));
    return renderEmailLayout(
      `
      <mj-text font-size="14px" line-height="26px">Good news — your order <strong>${order.orderNumber}</strong> is on its way!</mj-text>
      ${tracking}
      ${addressBlock(order)}
      ${cta}
    `,
      name,
    );
  }

  // Delivered.
  public static orderDelivered(name: string, order: OrderEmailData): string {
    return renderEmailLayout(
      `
      <mj-text font-size="14px" line-height="26px">Your order <strong>${order.orderNumber}</strong> has been delivered. We hope you love it!</mj-text>
      <mj-text font-size="13px" line-height="22px" padding-top="6px">Once you've had a chance to try it out, we'd love to hear your thoughts — leave a review to help other shoppers.</mj-text>
      ${emailButton("Leave a review", orderUrl(order.orderNumber))}
    `,
      name,
    );
  }

  // Cancelled.
  public static orderCancelled(name: string, order: OrderEmailData): string {
    return renderEmailLayout(
      `
      <mj-text font-size="14px" line-height="26px">Your order <strong>${order.orderNumber}</strong> has been cancelled. Any reserved stock has been released, and if you were charged a refund will follow.</mj-text>
      ${summaryBlock(order)}
      <mj-text font-size="13px" color="${this.colors.gray}">If this was a mistake or you have questions, just reply to this email.</mj-text>
    `,
      name,
    );
  }

  // Refund issued.
  public static refundIssued(
    name: string,
    order: OrderEmailData,
    amount?: number,
  ): string {
    const refunded = amount && amount > 0 ? amount : order.grandTotal;
    return renderEmailLayout(
      `
      <mj-text font-size="14px" line-height="26px">We've processed a refund for order <strong>${order.orderNumber}</strong>.</mj-text>
      <mj-text font-size="20px" color="${this.colors.success}" font-weight="700" align="center" padding="14px 0">${naira(refunded)} refunded</mj-text>
      <mj-text font-size="13px" color="${this.colors.gray}">Refunds typically take 5–10 business days to appear on your statement, depending on your bank.</mj-text>
    `,
      name,
    );
  }
}
