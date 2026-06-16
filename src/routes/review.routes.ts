import * as reviewCtrl from "../controllers/review.controller";
import auth from "../middlewares/auth";
import validateResource from "../middlewares/validateResource";
import { createAttributeRouter } from "../utils/routeBuilder.utils";
import { createReviewSchema } from "../schemas/review.schema";

const { router, get, post } = createAttributeRouter();

const GROUP = "Reviews";
const meta = (name: string, action: "Read" | "Write") => ({
  resource: "Review",
  action,
  group: GROUP,
  name,
});

// Public: list reviews for a product.
get(
  "/product/:productId",
  meta("get_product_reviews", "Read"),
  reviewCtrl.getProductReviewsHandler,
);

// Authenticated customer actions (self-service — no admin permission gate).
get("/me", meta("get_my_reviews", "Read"), auth, reviewCtrl.getMyReviewsHandler);
post(
  "/",
  meta("post_review_create", "Write"),
  auth,
  validateResource(createReviewSchema),
  reviewCtrl.createReviewHandler,
);

export default router;
