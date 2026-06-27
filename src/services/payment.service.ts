import crypto from "crypto";
import { getConfig } from "../config";
import AppError from "../errors/appError";
import log from "../utils/logger";

const secret = () => getConfig("paystackSecretKey");
const baseUrl = () => getConfig("paystackBaseUrl");

const paystackFetch = async (path: string, init: RequestInit = {}) => {
  const key = secret();
  if (!key) {
    throw new AppError(
      "Paystack is not configured. Set PAYSTACK_SECRET_KEY in the environment.",
      500,
    );
  }

  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || body?.status === false) {
    throw new AppError(
      body?.message || `Paystack request failed (${res.status})`,
      res.status >= 400 && res.status < 500 ? 400 : 502,
    );
  }
  return body;
};

// Naira → kobo (Paystack works in the minor unit).
const toKobo = (naira: number) => Math.round(naira * 100);

export interface InitializeResult {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
}

export const initializeTransaction = async (params: {
  email: string;
  amount: number; // in Naira
  reference: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
}): Promise<InitializeResult> => {
  const body = await paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: toKobo(params.amount),
      reference: params.reference,
      currency: "NGN",
      metadata: params.metadata,
      ...(params.callbackUrl ? { callback_url: params.callbackUrl } : {}),
    }),
  });

  return {
    authorizationUrl: body.data.authorization_url,
    reference: body.data.reference,
    accessCode: body.data.access_code,
  };
};

export interface VerifyResult {
  status: string; // "success" | "failed" | "abandoned" ...
  paid: boolean;
  amount: number; // Naira
  reference: string;
  raw: any;
}

export const verifyTransaction = async (
  reference: string,
): Promise<VerifyResult> => {
  const body = await paystackFetch(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  return {
    status: body.data.status,
    paid: body.data.status === "success",
    amount: (body.data.amount ?? 0) / 100,
    reference: body.data.reference,
    raw: body.data,
  };
};

export const refundTransaction = async (params: {
  reference: string;
  amount?: number; // Naira; omit for full refund
}) => {
  const body = await paystackFetch("/refund", {
    method: "POST",
    body: JSON.stringify({
      transaction: params.reference,
      ...(params.amount ? { amount: toKobo(params.amount) } : {}),
    }),
  });
  return body.data;
};

// Verify the x-paystack-signature header (HMAC SHA512 of the raw body).
export const verifyWebhookSignature = (
  rawBody: Buffer | string,
  signature?: string,
): boolean => {
  const key = secret();
  if (!key || !signature) return false;
  try {
    const hash = crypto.createHmac("sha512", key).update(rawBody).digest("hex");
    return hash === signature;
  } catch (err) {
    log.error(err, "Paystack signature verification error");
    return false;
  }
};
