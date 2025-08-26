import { getReasonPhrase } from "http-status-codes";

class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    this.message = `${getReasonPhrase(statusCode)}: ${message}`;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
