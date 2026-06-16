import * as auditCtrl from "../controllers/audit.controller";
import auth from "../middlewares/auth";
import { hasPermission } from "../middlewares/hasPermissions";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, get } = createAttributeRouter();

router.use(auth);

get(
  "/",
  {
    resource: "Audit",
    action: "Read",
    group: "System Management",
    name: "get_audit_logs",
  },
  hasPermission,
  auditCtrl.getAuditsHandler,
);

export default router;
