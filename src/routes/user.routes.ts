import {
  deleteUserHandler,
  getAllUsersHandler,
  getUserByIdHandler,
  updateUserHandler,
} from "../controllers/user.controller";
import auth from "../middlewares/auth";
import { hasPermission } from "../middlewares/hasPermissions";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, get, patch, delete: destroy } = createAttributeRouter();

get(
  "/",
  {
    resource: "User",
    action: "Read",
    group: "User Management",
    name: "get_users_list",
  },
  auth,
  hasPermission,
  getAllUsersHandler,
);

get(
  "/:id",
  {
    resource: "User",
    action: "Read",
    group: "User Management",
    name: "get_user_by_id",
  },
  auth,
  hasPermission,
  getUserByIdHandler,
);

patch(
  "/:id",
  {
    resource: "User",
    action: "Write",
    group: "User Management",
    name: "patch_user_update",
  },
  auth,
  hasPermission,
  updateUserHandler,
);

destroy(
  "/:id",
  {
    resource: "User",
    action: "Delete",
    group: "User Management",
    name: "delete_user",
  },
  auth,
  hasPermission,
  deleteUserHandler,
);

export default router;
