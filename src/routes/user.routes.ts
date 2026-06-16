import {
  changePasswordHandler,
  deleteUserHandler,
  getCustomersHandler,
  getCustomerStatsHandler,
  getStaffHandler,
  getUserByIdHandler,
  onboardUserHandler,
  updateUserHandler,
  getWishlistHandler,
  addWishlistHandler,
  removeWishlistHandler,
  getAddressesHandler,
  addAddressHandler,
  updateAddressHandler,
  deleteAddressHandler,
  setDefaultAddressHandler,
} from "../controllers/user.controller";
import {
  createAddressSchema,
  updateAddressSchema,
} from "../schemas/address.schema";
import auth from "../middlewares/auth";
import { hasPermission } from "../middlewares/hasPermissions";
import { createAttributeRouter } from "../utils/routeBuilder.utils";
import validateResource from "../middlewares/validateResource";

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
  "/stats",
  {
    resource: "User",
    action: "Read",
    group: "User Management",
    name: "get_customer_stats",
  },
  auth,
  hasPermission,
  getCustomerStatsHandler,
);

router.get("/wishlist", auth, getWishlistHandler);
router.post("/wishlist/:productId", auth, addWishlistHandler);
router.delete("/wishlist/:productId", auth, removeWishlistHandler);

router.get("/addresses", auth, getAddressesHandler);
router.post(
  "/addresses",
  auth,
  validateResource(createAddressSchema),
  addAddressHandler,
);
router.patch(
  "/addresses/:addressId",
  auth,
  validateResource(updateAddressSchema),
  updateAddressHandler,
);
router.patch("/addresses/:addressId/default", auth, setDefaultAddressHandler);
router.delete("/addresses/:addressId", auth, deleteAddressHandler);

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
