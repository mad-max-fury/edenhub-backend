import * as productCtrl from "../controllers/product.controller";
import auth from "../middlewares/auth";
import validateResource from "../middlewares/validateResource";
import { hasPermission } from "../middlewares/hasPermissions";
import {
  addVariantSchema,
  bulkCreateProductSchema,
  createProductSchema,
  productIdParamSchema,
  updateProductSchema,
  updateStatusSchema,
  updateVariantSchema,
} from "../schemas/product.schema";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, post, get, patch, delete: destroy } = createAttributeRouter();

const GROUP = "Product Management";

router.use(auth);

post(
  "/",
  {
    resource: "Product",
    action: "Write",
    group: GROUP,
    name: "post_product_create",
  },
  hasPermission,
  validateResource(createProductSchema),
  productCtrl.createProductHandler,
);

post(
  "/bulk",
  {
    resource: "Product",
    action: "Write",
    group: GROUP,
    name: "post_product_bulk_create",
  },
  hasPermission,
  validateResource(bulkCreateProductSchema),
  productCtrl.bulkCreateProductsHandler,
);

get(
  "/",
  {
    resource: "Product",
    action: "Read",
    group: GROUP,
    name: "get_products_list",
  },
  hasPermission,
  productCtrl.getProductsHandler,
);

get(
  "/stats",
  {
    resource: "Product",
    action: "Read",
    group: GROUP,
    name: "get_product_stats",
  },
  hasPermission,
  productCtrl.getProductStatsHandler,
);

get(
  "/:id",
  {
    resource: "Product",
    action: "Read",
    group: GROUP,
    name: "get_product_by_id",
  },
  hasPermission,
  validateResource(productIdParamSchema),
  productCtrl.getProductByIdHandler,
);

patch(
  "/:id/status",
  {
    resource: "Product",
    action: "Update",
    group: GROUP,
    name: "patch_product_status",
  },
  hasPermission,
  validateResource(updateStatusSchema),
  productCtrl.updateProductStatusHandler,
);

patch(
  "/:id",
  {
    resource: "Product",
    action: "Update",
    group: GROUP,
    name: "patch_product_update",
  },
  hasPermission,
  validateResource(updateProductSchema),
  productCtrl.updateProductHandler,
);

destroy(
  "/:id",
  {
    resource: "Product",
    action: "Delete",
    group: GROUP,
    name: "delete_product",
  },
  hasPermission,
  validateResource(productIdParamSchema),
  productCtrl.deleteProductHandler,
);

post(
  "/:id/variants",
  {
    resource: "Product",
    action: "Write",
    group: GROUP,
    name: "post_product_add_variant",
  },
  hasPermission,
  validateResource(addVariantSchema),
  productCtrl.addVariantHandler,
);

patch(
  "/:id/variants/:variantId",
  {
    resource: "Product",
    action: "Update",
    group: GROUP,
    name: "patch_product_update_variant",
  },
  hasPermission,
  validateResource(updateVariantSchema),
  productCtrl.updateVariantHandler,
);

destroy(
  "/:id/variants/:variantId",
  {
    resource: "Product",
    action: "Delete",
    group: GROUP,
    name: "delete_product_remove_variant",
  },
  hasPermission,
  productCtrl.removeVariantHandler,
);

export default router;
