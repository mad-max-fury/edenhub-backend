import logger from "pino";
import config from "config";
import dayjs from "dayjs";
const level = config.get<string>("logLevel");
let log: any;

log = logger({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
  base: {
    pid: false,
  },
  level,
  timestamp: () => `,"time":"${dayjs().format("YYYY-MM-DDTHH:mm:ssZ[Z]")}"`,
});

export default log;
