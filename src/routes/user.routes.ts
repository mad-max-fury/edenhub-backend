import {
  changePasswordHandler,
  deleteUserHandler,
  getCustomersHandler,
  getStaffHandler,
  getUserByIdHandler,
  onboardUserHandler,
  updateUserHandler,
} from "../controllers/user.controller";
import auth from "../middlewares/auth";
import { hasPermission } from "../middlewares/hasPermissions";
import { createAttributeRouter } from "../utils/routeBuilder.utils";
import validateResource from "../middlewares/validateResource";
import { createUserSchema } from "../schemas/auth.schemas";
import {
  changePasswordSchema,
  IOnboardUserSchema,
  paginationSchema,
} from "../schemas/user.schemas";

const { router, get, post, patch, delete: destroy } = createAttributeRouter();

post(
  "/onboard",
  {
    resource: "User",
    action: "Write",
    group: "User Management",
    name: "post_user_onboard",
  },
  auth,
  hasPermission,
  validateResource(IOnboardUserSchema),
  onboardUserHandler,
);

get(
  "/",
  {
    resource: "User",
    action: "Read",
    group: "User Management",
    name: "get_customers_list",
  },
  auth,
  hasPermission,
  validateResource(paginationSchema),
  getCustomersHandler,
);

get(
  "/staffs",
  {
    resource: "User",
    action: "Read",
    group: "User Management",
    name: "get_staff_list",
  },
  auth,
  hasPermission,
  validateResource(paginationSchema),
  getStaffHandler,
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

patch(
  "/change-password",
  {
    resource: "User",
    action: "Write",
    group: "User Management",
    name: "patch_user_change_password",
  },
  auth,
  validateResource(changePasswordSchema),
  changePasswordHandler,
);

export default router;
