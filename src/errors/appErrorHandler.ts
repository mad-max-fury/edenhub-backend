import { NextFunction, Request, Response } from "express";
import AppError from "./appError";
import logger from "../utils/logger";

const sendErrorDev = (err: any, res: Response) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: any, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  logger.error(err);
  return res.status(500).json({
    status: "error",
    message: "Internal Server Error 😓",
  });
};

const castErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const duplicateFieldError = (err: any) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: "${field}" (${value}). Please use another value!`;
  return new AppError(message, 409);
};

const validationError = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data: ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const JWTError = () => new AppError("Invalid token. Please log in again.", 401);
const JWTExpiredError = () =>
  new AppError("Your session has expired. Please log in again.", 401);

const appErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  let error = { ...err, message: err.message };

  if (error.kind === "ObjectId") error = castErrorDB(error);
  if (error.code === 11000) error = duplicateFieldError(error);
  if (error.name === "ValidationError") error = validationError(error);
  if (error.name === "JsonWebTokenError") error = JWTError();
  if (error.name === "TokenExpiredError") error = JWTExpiredError();

  const environment = process.env.NODE_ENV || "production";

  if (environment === "development") {
    return sendErrorDev(err, res);
  }

  sendErrorProd(error, res);
};

export default appErrorHandler;
