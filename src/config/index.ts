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
};

const config: Config = {
  port: parseInt(process.env.PORT || "3000"),
  env: process.env.NODE_ENV || "development",

  dbUri: process.env.dbUri!,

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

  logLevel: process.env.logLevel || "i",
};

export const getConfig = <T extends keyof typeof config>(
  key: T,
): (typeof config)[T] => {
  return config[key];
};
