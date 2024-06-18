export default {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || "development",
  dbUri: process.env.dbUri,
  logLevel: "info",
};
