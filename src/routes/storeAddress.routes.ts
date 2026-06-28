import * as ctrl from "../controllers/storeAddress.controller";
import auth from "../middlewares/auth";
import { hasPermission } from "../middlewares/hasPermissions";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, get, post, patch, delete: destroy } = createAttributeRouter();
const GROUP = "System Management";

router.use(auth);

get("/", { resource: "StoreAddress", action: "Read", group: GROUP, name: "get_store_addresses" }, hasPermission, ctrl.listHandler);
post("/", { resource: "StoreAddress", action: "Write", group: GROUP, name: "create_store_address" }, hasPermission, ctrl.createHandler);
patch("/:id", { resource: "StoreAddress", action: "Update", group: GROUP, name: "update_store_address" }, hasPermission, ctrl.updateHandler);
patch("/:id/default", { resource: "StoreAddress", action: "Update", group: GROUP, name: "set_default_store_address" }, hasPermission, ctrl.setDefaultHandler);
destroy("/:id", { resource: "StoreAddress", action: "Delete", group: GROUP, name: "delete_store_address" }, hasPermission, ctrl.deleteHandler);

export default router;
