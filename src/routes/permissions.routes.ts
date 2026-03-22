import express from "express";

import auth from "../middlewares/auth";
import { createAttributeRouter } from "../utils/routeBuilder.utils";
import { hasPermission } from "../middlewares/hasPermissions";
import * as permissionsCtrl from "../controllers/permission.controller";

const { router, get } = createAttributeRouter();

router.use(auth);

get(
  "/",
  {
    resource: "Permission",
    action: "Read",
    group: "Access Control",
    name: "get_permissions",
  },
  hasPermission,
  permissionsCtrl.getPermissionsHandler,
);

export default router;
