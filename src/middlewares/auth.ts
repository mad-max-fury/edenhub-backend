import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import AppError from "../errors/appError";
import { findOneUser } from "../services/user.service";
import { getConfig } from "../config";

export interface UserPayload extends JwtPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized access. Token is missing.", 401);
    }

    const token = authHeader.split(" ")[1];
    const secret = getConfig("jwtSecret");
    if (!secret) {
      throw new AppError("JWT secret not configured.", 500);
    }

    const decoded = jwt.verify(token, secret) as UserPayload;
    req.user = { id: decoded.id };

    const user = await findOneUser({ _id: (decoded as JwtPayload).id });
    if (!user) {
      throw new AppError(
        "User associated with this token no longer exists.",
        401,
      );
    }

    next();
  } catch (err: any) {
    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 403));
    }
    if (err.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired. Please log in again.", 403),
      );
    }

    next(err);
  }
};

export default auth;
