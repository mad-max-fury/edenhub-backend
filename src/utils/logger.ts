import pino, { Logger } from "pino";
import dayjs from "dayjs";
import { getConfig } from "../config";

const isProduction = process.env.NODE_ENV === "production";

class EdenLogger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!EdenLogger.instance) {
      const level = getConfig("logLevel") || "info";

      EdenLogger.instance = pino({
        level,
        transport: !isProduction
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
                levelFirst: true,
                translateTime: "yyyy-mm-dd HH:MM:ss.l",
                ignore: "pid,hostname,app,env",
              },
            }
          : undefined,

        base: {
          app: "EdenHub-Commerce",
          env: process.env.NODE_ENV || "development",
        },

        timestamp: () => `,"time":"${dayjs().toISOString()}"`,

        formatters: {
          level: (label) => {
            return { level: label.toUpperCase() };
          },
        },

        hooks: {
          logMethod(inputArgs, method) {
            if (typeof inputArgs[0] === "string") {
              inputArgs[0] = `[EdenHub] ${inputArgs[0]}`;
            }
            method.apply(this, inputArgs);
          },
        },
      });
    }

    return EdenLogger.instance;
  }
}

const log = EdenLogger.getInstance();
export default log;
