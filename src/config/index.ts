import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["JWT_SECRET", "dbUri"] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

type Config = {
  port: number;
  env: string;
  dbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  jwtRefreshExpirationInterval: string;
  sessionSecret: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleCallbackUrl: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  emailProvider: string;
  emailRestrictRecipients: boolean;
  emailAllowedRecipients: string[];
  emailFrom: string;
  sendgridApiKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  logLevel?: string;
  allowedOrigins: string[];
  awsBucketName: string;
  awsAccessKey: string;
  awsSecretKey: string;
  awsRegion: string;
  storefrontUrl: string;
  paystackSecretKey: string;
  paystackBaseUrl: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  shipbubbleApiKey: string;
  shipbubbleBaseUrl: string;
  shipOrigin: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
};

const config: Config = {
  port: parseInt(process.env.PORT || "3000"),
  env: process.env.NODE_ENV || "development",

  dbUri: process.env.dbUri!,
  // Frontend origin allow-list for CORS (admin + storefront across
  // dev/staging/prod). Comma-separated in `frontendUrls`. Falls back to the
  // common local dev origins so a fresh checkout works without config.
  allowedOrigins: (
    process.env.frontendUrls ||
    "http://localhost:3000,http://localhost:5173,http://localhost:5174"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.jwtExpiresIn || "15m",
  jwtRefreshExpiresIn: process.env.jwtRefreshExpiresIn || "7d",
  jwtRefreshExpirationInterval:
    process.env.jwtRefreshExpirationInterval || "30d",

  sessionSecret: process.env.SESSION_SECRET || "your-session-secret",

  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || "",

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  // Transport selector: "smtp" | "sendgrid" | "console".
  // Defaults to sendgrid in production, smtp elsewhere; EMAIL_PROVIDER overrides.
  emailProvider:
    process.env.EMAIL_PROVIDER ||
    (process.env.NODE_ENV === "production" ? "sendgrid" : "smtp"),
  // Recipient guard. When enabled, real emails are only delivered to the
  // addresses/domains in emailAllowedRecipients (everything else is skipped).
  // Defaults to ON outside production; EMAIL_RESTRICT_RECIPIENTS overrides so
  // staging can stay restricted even when NODE_ENV=production.
  emailRestrictRecipients:
    process.env.EMAIL_RESTRICT_RECIPIENTS !== undefined
      ? process.env.EMAIL_RESTRICT_RECIPIENTS === "true"
      : process.env.NODE_ENV !== "production",
  // Allow-list entries may be whole domains ("yopmail.com") or exact addresses
  // ("qa@edenhub.com"). EMAIL_ALLOWED_RECIPIENTS preferred; falls back to the
  // legacy DEV_EMAIL_ALLOWED_DOMAINS. Default: yopmail.com.
  emailAllowedRecipients: (
    process.env.EMAIL_ALLOWED_RECIPIENTS ||
    process.env.DEV_EMAIL_ALLOWED_DOMAINS ||
    "yopmail.com"
  )
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),
  emailFrom: process.env.EMAIL_FROM || "noreply@edenhub.com",
  sendgridApiKey: process.env.SENDGRID_API_KEY || "",
  smtpHost: process.env.SMTP_HOST || "smtp.example.com",
  smtpPort: parseInt(process.env.SMTP_PORT || "587"),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  awsAccessKey: process.env.awsAccessKey || "",
  awsBucketName: process.env.awsBucketName || "",
  awsRegion: process.env.awsRegion || "",
  awsSecretKey: process.env.awsSecretKey || "",

  storefrontUrl: process.env.STOREFRONT_URL || "http://localhost:3001",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
  paystackBaseUrl: process.env.PAYSTACK_BASE_URL || "https://api.paystack.co",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  shipbubbleApiKey: process.env.SHIPBUBBLE_API_KEY || "",
  shipbubbleBaseUrl:
    process.env.SHIPBUBBLE_BASE_URL || "https://api.shipbubble.com/v1",

  // Ship-from / store origin (replace placeholders via .env or here).
  shipOrigin: {
    name: process.env.SHIP_ORIGIN_NAME || "EdenHub Store",
    email: process.env.SHIP_ORIGIN_EMAIL || "store@edenhub.com",
    phone: process.env.SHIP_ORIGIN_PHONE || "08000000000",
    address:
      process.env.SHIP_ORIGIN_ADDRESS || "1 Admiralty Way, Lekki Phase 1",
    city: process.env.SHIP_ORIGIN_CITY || "Lekki",
    state: process.env.SHIP_ORIGIN_STATE || "Lagos",
    country: process.env.SHIP_ORIGIN_COUNTRY || "Nigeria",
  },

  logLevel: process.env.logLevel || "i",
};

export const getConfig = <T extends keyof typeof config>(
  key: T,
): (typeof config)[T] => {
  return config[key];
};
