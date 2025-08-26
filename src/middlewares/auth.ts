import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import AppError from "../errors/appError";
import { findOneUser } from "../services/user.service";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | string;
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
    const secret = process.env.JWT_SECREET;
    if (!secret) {
      throw new AppError("JWT secret not configured.", 500);
    }

    // Verify the token
    const decoded = jwt.verify(token, secret);
    req.user = decoded;

    const user = await findOneUser({ _id: (decoded as JwtPayload).id });
    if (!user) {
      throw new AppError(
        "User associated with this token no longer exists.",
        401
      );
    }

    next();
  } catch (err: any) {
    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    if (err.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired. Please log in again.", 401)
      );
    }

    next(err);
  }
};

export default auth;
