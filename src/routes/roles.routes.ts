import * as roleCtrl from "../controllers/role.controller";
import validateResource from "../middlewares/validateResource";
import auth from "../middlewares/auth";
import { hasPermission } from "../middlewares/hasPermissions";
import {
  createRoleSchema,
  updateRoleSchema,
  roleParamsSchema,
} from "../schemas/role.schema";
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

get(
  "/unpaginated",
  {
    resource: "Role",
    action: "Read",
    group: "Access Control",
    name: "get_unpaginated_roles_list",
  },
  auth,
  hasPermission,
  roleCtrl.getRolesUnpaginatedHandler,
);

get(
  "/:id",
  {
    resource: "Role",
    action: "Read",
    group: "Access Control",
    name: "get_role_by_id",
  },
  auth,
  hasPermission,
  validateResource(roleParamsSchema),
  roleCtrl.getRoleByIdHandler,
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
  validateResource(roleParamsSchema),
  roleCtrl.deleteRoleHandler,
);

export default router;
