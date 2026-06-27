import * as faqCtrl from "../controllers/faq.controller";
import auth from "../middlewares/auth";
import validateResource from "../middlewares/validateResource";
import { hasPermission } from "../middlewares/hasPermissions";
import {
  createFaqSchema,
  faqIdParamSchema,
  updateFaqSchema,
} from "../schemas/faq.schema";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, post, get, patch, delete: destroy } = createAttributeRouter();

const GROUP = "FAQ Management";

// ─── Public (storefront) ─────────────────────────────────────────────────────
get(
  "/public",
  { resource: "Faq", action: "Read", group: GROUP, name: "get_faqs_public" },
  faqCtrl.getPublicFaqsHandler,
);

// ─── Admin ───────────────────────────────────────────────────────────────────
get(
  "/",
  { resource: "Faq", action: "Read", group: GROUP, name: "get_faqs_list" },
  auth,
  hasPermission,
  faqCtrl.getFaqsHandler,
);

post(
  "/",
  { resource: "Faq", action: "Write", group: GROUP, name: "post_faq_create" },
  auth,
  hasPermission,
  validateResource(createFaqSchema),
  faqCtrl.createFaqHandler,
);

patch(
  "/:id",
  { resource: "Faq", action: "Update", group: GROUP, name: "patch_faq_update" },
  auth,
  hasPermission,
  validateResource(updateFaqSchema),
  faqCtrl.updateFaqHandler,
);

destroy(
  "/:id",
  { resource: "Faq", action: "Delete", group: GROUP, name: "delete_faq" },
  auth,
  hasPermission,
  validateResource(faqIdParamSchema),
  faqCtrl.deleteFaqHandler,
);

export default router;
