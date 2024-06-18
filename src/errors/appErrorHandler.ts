import { NextFunction, Request, Response } from "express";
import AppError from "./appError";
import logger from "../utils/logger";
// Error Handling For Development Mode
const sendErrorDev = (err: any, res: Response) => {
  return res.status(err.statusCode).send({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Error Handling For Production Mode
const sendErrorProd = (err: any, res: Response) => {
  // If error is operational (trusted), send message to client
  if (err.isOperational) {
    res.status(err.statusCode).send({
      status: err.status,
      message: err.message,
    });
    // For Unknown errors (untrusted), handle internally
  } else {
    logger.error(err);
    res.status(500).send({
      status: "error",
      message: "Internal Server Error😓!",
    });
  }
};

////// Handle Individual Errors
// DB Cast Error
const castErrorDB = (err: any) => {
  let message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// Duplicate Field Error
const duplicateFieldError = (err: any) => {
  console.log(err);
  // Extract the field and its value from err.keyValue
  let field = Object.keys(err.keyValue)[0];
  let value = err.keyValue[field];
  let message = `Duplicate Field Value: ${field} - ${value}. Please Use Another One!`;
  return new AppError(message, 409);
};

// Validation Error
const validationError = (err: any) => {
  let errors = Object.values(err.errors).map((el: any) => el.message);
  let message = `Invalid Input Data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

//// JWT Errors
// Unauthorized error
const JWTError = () => new AppError("Please Login Again", 401);

// ExpiredError
const JWTExpiredError = () =>
  new AppError("Session Expired! Please Login Again", 401);

const appErrorHandler = function (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  const stage = process.env.STAGE;

  if (stage === "qa") {
    return sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };
    if (error.kind === "ObjectId") error = castErrorDB(error);
    if (error.code === 11000) error = duplicateFieldError(error);
    if (error.name === "ValidationError") error = validationError(error);
    if (error.name === "JsonWebToken") error = JWTError();
    if (error.name === "TokenExpiresError") error = JWTExpiredError();

    sendErrorProd(error, res);
  }
};

export default appErrorHandler;
