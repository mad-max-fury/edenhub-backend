import * as roleCtrl from "../controllers/role.controller";
import validateResource from "../middlewares/validateResource";
import auth from "../middlewares/auth";
import { hasPermission } from "../middlewares/hasPermissions";
import { createRoleSchema, updateRoleSchema } from "../schemas/role.schema";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, get, post, patch, delete: destroy } = createAttributeRouter();

post(
  "/",
  {
    resource: "Role",
    action: "Write",
    group: "Access Control",
    name: "post_role_create",
  },
  auth,
  hasPermission,
  validateResource(createRoleSchema),
  roleCtrl.createRoleHandler,
);

get(
  "/",
  {
    resource: "Role",
    action: "Read",
    group: "Access Control",
    name: "get_roles_list",
  },
  auth,
  hasPermission,
  roleCtrl.getRolesHandler,
);

patch(
  "/:id",
  {
    resource: "Role",
    action: "Write",
    group: "Access Control",
    name: "patch_role_update",
  },
  auth,
  hasPermission,
  validateResource(updateRoleSchema),
  roleCtrl.updateRoleHandler,
);

destroy(
  "/:id",
  {
    resource: "Role",
    action: "Delete",
    group: "Access Control",
    name: "delete_role",
  },
  auth,
  hasPermission,
  roleCtrl.deleteRoleHandler,
);

export default router;
