import * as adCtrl from "../controllers/ad.controller";
import auth from "../middlewares/auth";
import validateResource from "../middlewares/validateResource";
import { hasPermission } from "../middlewares/hasPermissions";
import {
  adIdParamSchema,
  createAdSchema,
  updateAdSchema,
} from "../schemas/ad.schema";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, post, get, patch, delete: destroy } = createAttributeRouter();

const GROUP = "Ads Management";

// ─── Public (storefront) ─────────────────────────────────────────────────────
get(
  "/active",
  { resource: "Ad", action: "Read", group: GROUP, name: "get_active_ads" },
  adCtrl.getActiveAdsHandler,
);

// ─── Admin ───────────────────────────────────────────────────────────────────
get(
  "/",
  { resource: "Ad", action: "Read", group: GROUP, name: "get_ads_list" },
  auth,
  hasPermission,
  adCtrl.getAdsHandler,
);

post(
  "/",
  { resource: "Ad", action: "Write", group: GROUP, name: "post_ad_create" },
  auth,
  hasPermission,
  validateResource(createAdSchema),
  adCtrl.createAdHandler,
);

patch(
  "/:id",
  { resource: "Ad", action: "Update", group: GROUP, name: "patch_ad_update" },
  auth,
  hasPermission,
  validateResource(updateAdSchema),
  adCtrl.updateAdHandler,
);

destroy(
  "/:id",
  { resource: "Ad", action: "Delete", group: GROUP, name: "delete_ad" },
  auth,
  hasPermission,
  validateResource(adIdParamSchema),
  adCtrl.deleteAdHandler,
);

// Public ad detail with products (kept after the admin routes above).
get(
  "/:id",
  { resource: "Ad", action: "Read", group: GROUP, name: "get_ad_by_id" },
  adCtrl.getAdByIdHandler,
);

export default router;
