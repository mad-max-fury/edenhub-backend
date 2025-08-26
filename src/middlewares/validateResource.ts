import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import AppError from "../errors/appError";

const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const errors = e.errors.map((error) => error.message);
        const message =
          errors.join(", ") || "Invalid or incomplete request body";
        return next(new AppError(message, 417));
      }
      return next(e);
    }
  };

export default validate;
