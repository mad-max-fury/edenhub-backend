import {
  deleteResource,
  getResourceInfo,
  uploadResource,
} from "../controllers/upload.controller";
import { createAttributeRouter } from "../utils/routeBuilder.utils";
import auth from "../middlewares/auth";
import { uploadMiddleware } from "../middlewares/upload";
import validateResource from "../middlewares/validateResource";
import { fileUploadSchema } from "../schemas/resource.schemas";

const { router, post, delete: del, get } = createAttributeRouter();

post(
  "/upload",
  {
    resource: "Resource",
    action: "Write",
    group: "System Management",
    name: "post_resource_upload",
  },
  auth,
  uploadMiddleware.single("file"),
  validateResource(fileUploadSchema),
  uploadResource,
);

get(
  "/info",
  {
    resource: "Resource",
    action: "Read",
    group: "System Management",
    name: "get_resource_info",
  },
  auth,
  getResourceInfo,
);

del(
  "/",
  {
    resource: "Resource",
    action: "Delete",
    group: "System Management",
    name: "delete_resource",
  },
  auth,
  deleteResource,
);

export default router;
