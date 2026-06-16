import express from "express";
import * as notificationCtrl from "../controllers/notification.controller";
import auth from "../middlewares/auth";

// Authenticated user notifications (admin feed + personal).
const router = express.Router();

router.use(auth);

router.get("/", notificationCtrl.getNotificationsHandler);
router.get("/unread-count", notificationCtrl.getUnreadCountHandler);
router.patch("/read-all", notificationCtrl.markAllReadHandler);
router.patch("/:id/read", notificationCtrl.markReadHandler);

export default router;
