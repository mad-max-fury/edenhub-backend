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
  callbackURL?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  emailHostName?: string;
  emailHostPort: number;
  emailFrom: string;
  sendgridApiKey?: string;
  logLevel?: string;
};

const config: Config = {
  // Server
  port: parseInt(process.env.PORT || "3000"),
  env: process.env.NODE_ENV || "development",

  // Database
  dbUri: process.env.dbUri!,

  // JWT
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.jwtExpiresIn || "15m",
  jwtRefreshExpiresIn: process.env.jwtRefreshExpiresIn || "7d",
  jwtRefreshExpirationInterval:
    process.env.jwtRefreshExpirationInterval || "30d",

  // Session
  sessionSecret: process.env.SESSION_SECRET || "your-session-secret",

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  // Email
  emailHostName: process.env.EMAIL_HOST,
  emailHostPort: parseInt(process.env.EMAIL_HOST_PORT || "587"),
  emailFrom: process.env.EMAIL_FROM || "noreply@edenhub.com",
  sendgridApiKey: process.env.SENDGRID_API_KEY,

  // Logging
  logLevel: process.env.logLevel || "i",
};

// Helper function to get config values (similar to config.get())
export const getConfig = <T extends keyof typeof config>(
  key: T
): (typeof config)[T] => {
  return config[key];
};
