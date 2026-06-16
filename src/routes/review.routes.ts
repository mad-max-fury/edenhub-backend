import express from "express";
import * as reviewCtrl from "../controllers/review.controller";
import auth from "../middlewares/auth";
import validateResource from "../middlewares/validateResource";
import { createReviewSchema } from "../schemas/review.schema";

const router = express.Router();

// Public: list reviews for a product.
router.get("/product/:productId", reviewCtrl.getProductReviewsHandler);

// Authenticated customer actions.
router.get("/me", auth, reviewCtrl.getMyReviewsHandler);
router.post(
  "/",
  auth,
  validateResource(createReviewSchema),
  reviewCtrl.createReviewHandler,
);

export default router;
