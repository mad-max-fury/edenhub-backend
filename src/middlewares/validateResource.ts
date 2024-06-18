import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { AnyZodObject } from "zod";

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
    } catch (e: any) {

      const message = JSON.parse(e.message).map((error: any) => error.message);
      return res.status(417).send({
        staus: "failed",
        message: message || "Invalid or Incomplete request body",
      });
    }
  };

export default validate;
