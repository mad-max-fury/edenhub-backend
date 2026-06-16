import * as categoryCtrl from "../controllers/category.controller";
import auth from "../middlewares/auth";
import validateResource from "../middlewares/validateResource";
import { hasPermission } from "../middlewares/hasPermissions";
import {
  addAttributeSchema,
  bulkCreateCategorySchema,
  categoryIdParamSchema,
  createCategorySchema,
  updateAttributeSchema,
  updateCategorySchema,
} from "../schemas/category.schema";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, post, get, patch, delete: destroy } = createAttributeRouter();

const GROUP = "Catalog Management";

router.use(auth);

post(
  "/",
  {
    resource: "Category",
    action: "Write",
    group: GROUP,
    name: "post_category_create",
  },
  hasPermission,
  validateResource(createCategorySchema),
  categoryCtrl.createCategoryHandler,
);

post(
  "/bulk",
  {
    resource: "Category",
    action: "Write",
    group: GROUP,
    name: "post_category_bulk_create",
  },
  hasPermission,
  validateResource(bulkCreateCategorySchema),
  categoryCtrl.bulkCreateCategoriesHandler,
);

get(
  "/",
  {
    resource: "Category",
    action: "Read",
    group: GROUP,
    name: "get_categories_list",
  },
  hasPermission,
  categoryCtrl.getCategoriesHandler,
);

get(
  "/tree",
  {
    resource: "Category",
    action: "Read",
    group: GROUP,
    name: "get_category_tree",
  },
  hasPermission,
  categoryCtrl.getCategoryTreeHandler,
);

get(
  "/unpaginated",
  {
    resource: "Category",
    action: "Read",
    group: GROUP,
    name: "get_categories_unpaginated",
  },
  hasPermission,
  categoryCtrl.getCategoriesUnpaginatedHandler,
);

get(
  "/:id",
  {
    resource: "Category",
    action: "Read",
    group: GROUP,
    name: "get_category_by_id",
  },
  hasPermission,
  validateResource(categoryIdParamSchema),
  categoryCtrl.getCategoryByIdHandler,
);

patch(
  "/:id",
  {
    resource: "Category",
    action: "Update",
    group: GROUP,
    name: "patch_category_update",
  },
  hasPermission,
  validateResource(updateCategorySchema),
  categoryCtrl.updateCategoryHandler,
);

destroy(
  "/:id",
  {
    resource: "Category",
    action: "Delete",
    group: GROUP,
    name: "delete_category",
  },
  hasPermission,
  validateResource(categoryIdParamSchema),
  categoryCtrl.deleteCategoryHandler,
);

post(
  "/:id/attributes",
  {
    resource: "Category",
    action: "Write",
    group: GROUP,
    name: "post_category_add_attribute",
  },
  hasPermission,
  validateResource(addAttributeSchema),
  categoryCtrl.addAttributeHandler,
);

patch(
  "/:id/attributes/:attributeId",
  {
    resource: "Category",
    action: "Update",
    group: GROUP,
    name: "patch_category_update_attribute",
  },
  hasPermission,
  validateResource(updateAttributeSchema),
  categoryCtrl.updateAttributeHandler,
);

destroy(
  "/:id/attributes/:attributeId",
  {
    resource: "Category",
    action: "Delete",
    group: GROUP,
    name: "delete_category_remove_attribute",
  },
  hasPermission,
  categoryCtrl.removeAttributeHandler,
);

export default router;
