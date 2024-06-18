import logger from "pino";
import config from "config";
import dayjs from "dayjs";
const level = config.get<string>("logLevel");
let log: any;

log = logger({
  transport: {
    target: "pino-pretty",
  },
  base: {
    pid: false,
  },
  level,
  timestamp: () => `,"time":"${dayjs().format()}"`,
});

export default log;
