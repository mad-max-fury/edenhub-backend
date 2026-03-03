import express from "express";
import * as groupCtrl from "../controllers/group.controller";
import auth from "../middlewares/auth";
import validateResource from "../middlewares/validateResource";
import { hasPermission } from "../middlewares/hasPermissions";
import { createGroupSchema, updateGroupSchema } from "../schemas/group.schema";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, post, get, patch, delete: destroy } = createAttributeRouter();

router.use(auth);

post(
  "/",
  {
    resource: "Group",
    action: "Write",
    group: "Access Control",
    name: "post_group_create",
  },
  hasPermission,
  validateResource(createGroupSchema),
  groupCtrl.createGroupHandler,
);

get(
  "/",
  {
    resource: "Group",
    action: "Read",
    group: "Access Control",
    name: "get_groups_list",
  },
  hasPermission,
  groupCtrl.getGroupsHandler,
);

patch(
  "/:id",
  {
    resource: "Group",
    action: "Update",
    group: "Access Control",
    name: "patch_group_update",
  },
  hasPermission,
  validateResource(updateGroupSchema),
  groupCtrl.updateGroupHandler,
);

destroy(
  "/:id",
  {
    resource: "Group",
    action: "Delete",
    group: "Access Control",
    name: "delete_group",
  },
  hasPermission,
  groupCtrl.deleteGroupHandler,
);

export default router;
