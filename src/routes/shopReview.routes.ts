import * as ctrl from "../controllers/shopReview.controller";
import { uploadResource } from "../controllers/upload.controller";
import auth from "../middlewares/auth";
import validateResource from "../middlewares/validateResource";
import { hasPermission } from "../middlewares/hasPermissions";
import { uploadMiddleware } from "../middlewares/upload";
import {
  createShopReviewSchema,
  shopReviewIdParamSchema,
  updateShopReviewStatusSchema,
} from "../schemas/shopReview.schema";
import { fileUploadSchema } from "../schemas/resource.schemas";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, post, get, patch, delete: destroy } = createAttributeRouter();

const GROUP = "Shop Reviews";

// ─── Public (storefront) ─────────────────────────────────────────────────────
post(
  "/",
  {
    resource: "ShopReview",
    action: "Write",
    group: GROUP,
    name: "post_shop_review_create",
  },
  validateResource(createShopReviewSchema),
  ctrl.createShopReviewHandler,
);

get(
  "/",
  {
    resource: "ShopReview",
    action: "Read",
    group: GROUP,
    name: "get_shop_reviews_public",
  },
  ctrl.getApprovedReviewsHandler,
);

// Public image upload for reviewer pictures (no auth — image only, forced folder).
post(
  "/image",
  {
    resource: "ShopReview",
    action: "Write",
    group: GROUP,
    name: "post_shop_review_image",
  },
  uploadMiddleware.single("file"),
  validateResource(fileUploadSchema),
  uploadResource,
);

// ─── Admin ───────────────────────────────────────────────────────────────────
post(
  "/admin",
  {
    resource: "ShopReview",
    action: "Write",
    group: GROUP,
    name: "post_shop_review_admin_create",
  },
  auth,
  hasPermission,
  validateResource(createShopReviewSchema),
  ctrl.adminCreateShopReviewHandler,
);

get(
  "/all",
  {
    resource: "ShopReview",
    action: "Read",
    group: GROUP,
    name: "get_shop_reviews_all",
  },
  auth,
  hasPermission,
  ctrl.getAllShopReviewsHandler,
);

get(
  "/stats",
  {
    resource: "ShopReview",
    action: "Read",
    group: GROUP,
    name: "get_shop_reviews_stats",
  },
  auth,
  hasPermission,
  ctrl.getShopReviewStatsHandler,
);

patch(
  "/:id/status",
  {
    resource: "ShopReview",
    action: "Update",
    group: GROUP,
    name: "patch_shop_review_status",
  },
  auth,
  hasPermission,
  validateResource(updateShopReviewStatusSchema),
  ctrl.updateShopReviewStatusHandler,
);

destroy(
  "/:id",
  {
    resource: "ShopReview",
    action: "Delete",
    group: GROUP,
    name: "delete_shop_review",
  },
  auth,
  hasPermission,
  validateResource(shopReviewIdParamSchema),
  ctrl.deleteShopReviewHandler,
);

export default router;
