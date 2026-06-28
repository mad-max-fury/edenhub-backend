import Stripe from "stripe";
import { getConfig } from "../config";
import AppError from "../errors/appError";
import log from "../utils/logger";

const getStripe = () => {
  const key = getConfig("stripeSecretKey");
  if (!key) {
    throw new AppError(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in the environment.",
      500,
    );
  }
  return new Stripe(key);
};

export interface StripeSessionResult {
  sessionId: string;
  url: string;
}

export const createCheckoutSession = async (params: {
  email: string;
  amount: number;
  currency?: string;
  reference: string;
  orderId: string;
  callbackUrl: string;
}): Promise<StripeSessionResult> => {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.email,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: params.currency || "ngn",
          product_data: {
            name: `Order ${params.reference}`,
          },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: params.orderId,
      reference: params.reference,
    },
    success_url: `${params.callbackUrl}?reference=${params.reference}&provider=stripe`,
    cancel_url: `${params.callbackUrl}?reference=${params.reference}&provider=stripe&cancelled=true`,
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
};

export const retrieveSession = async (sessionId: string) => {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId);
};

export const verifyPaymentByReference = async (
  reference: string,
): Promise<{ paid: boolean; sessionId?: string }> => {
  const stripe = getStripe();

  const sessions = await stripe.checkout.sessions.list({
    limit: 5,
  });

  const match = sessions.data.find(
    (s) => s.metadata?.reference === reference,
  );

  if (!match) return { paid: false };

  return {
    paid: match.payment_status === "paid",
    sessionId: match.id,
  };
};

export const constructWebhookEvent = (
  rawBody: Buffer | string,
  signature: string,
): Stripe.Event => {
  const stripe = getStripe();
  const webhookSecret = getConfig("stripeWebhookSecret");
  if (!webhookSecret) {
    throw new AppError("Stripe webhook secret not configured", 500);
  }
  return stripe.webhooks.constructEvent(rawBody as any, signature, webhookSecret);
};
