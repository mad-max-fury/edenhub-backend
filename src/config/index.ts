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
  allowedOrigins: process.env.frontendUrls?.split(",") as string[],

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

  storefrontUrl: process.env.STOREFRONT_URL || "http://localhost:3000",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
  paystackBaseUrl: process.env.PAYSTACK_BASE_URL || "https://api.paystack.co",
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
