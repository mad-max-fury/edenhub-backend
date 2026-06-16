import * as notificationCtrl from "../controllers/notification.controller";
import auth from "../middlewares/auth";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

// Authenticated user notifications (personal feed — any signed-in user).
const { router, get, patch } = createAttributeRouter();

const GROUP = "Notifications";
const meta = (name: string, action: "Read" | "Update") => ({
  resource: "Notification",
  action,
  group: GROUP,
  name,
});

router.use(auth);

get("/", meta("get_notifications", "Read"), notificationCtrl.getNotificationsHandler);
get(
  "/unread-count",
  meta("get_notifications_unread_count", "Read"),
  notificationCtrl.getUnreadCountHandler,
);
patch(
  "/read-all",
  meta("patch_notifications_read_all", "Update"),
  notificationCtrl.markAllReadHandler,
);
patch(
  "/:id/read",
  meta("patch_notification_read", "Update"),
  notificationCtrl.markReadHandler,
);

export default router;
