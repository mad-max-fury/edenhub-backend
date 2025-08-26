import logger from "pino";
import config from "config";
import dayjs from "dayjs";

const level = config.get<string>("logLevel") || "info";

const log = logger({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: "yyyy-mm-dd HH:MM:ss.l",
      ignore: "pid,hostname",
    },
  },
  base: {
    app: "EdenHub Commerce App",
    env: process.env.NODE_ENV || "development",
  },
  level,
  timestamp: () => `,"time":"${dayjs().format("YYYY-MM-DDTHH:mm:ssZ[Z]")}"`,
  hooks: {
    logMethod(inputArgs, method) {
      if (typeof inputArgs[0] === "string") {
        inputArgs[0] = `[EdenHub]: ${inputArgs[0]}`;
      }
      method.apply(this, inputArgs);
    },
  },
});

export default log;
