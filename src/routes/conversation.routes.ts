import * as ctrl from "../controllers/conversation.controller";
import { uploadResource } from "../controllers/upload.controller";
import auth from "../middlewares/auth";
import { uploadMiddleware } from "../middlewares/upload";
import validateResource from "../middlewares/validateResource";
import {
  createConversationSchema,
  sendMessageSchema,
} from "../schemas/conversation.schema";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, get, post, patch } = createAttributeRouter();

const GROUP = "Messages";
const meta = (name: string, action: "Read" | "Write" | "Update") => ({
  resource: "Conversation",
  action,
  group: GROUP,
  name,
});

router.use(auth);

// Chat file upload — any authenticated user
post(
  "/upload",
  meta("upload_chat_file", "Write"),
  uploadMiddleware.single("file"),
  uploadResource,
);

// ── Customer (storefront) endpoints ──
post(
  "/me",
  meta("create_conversation", "Write"),
  validateResource(createConversationSchema),
  ctrl.customerCreateHandler,
);
get("/me", meta("list_my_conversations", "Read"), ctrl.customerListHandler);
get("/me/unread", meta("my_unread_count", "Read"), ctrl.customerUnreadHandler);
get("/me/:id", meta("get_my_conversation", "Read"), ctrl.customerGetHandler);
post(
  "/me/:id/reply",
  meta("reply_my_conversation", "Write"),
  validateResource(sendMessageSchema),
  ctrl.customerReplyHandler,
);

// ── Admin endpoints ──
get("/customer/:customerId", meta("find_or_create_conversation", "Read"), ctrl.adminFindOrCreateHandler);
get("/", meta("list_all_conversations", "Read"), ctrl.adminListHandler);
get("/unread", meta("admin_unread_count", "Read"), ctrl.adminUnreadHandler);
get("/:id", meta("get_conversation", "Read"), ctrl.adminGetHandler);
post(
  "/:id/reply",
  meta("reply_conversation", "Write"),
  validateResource(sendMessageSchema),
  ctrl.adminReplyHandler,
);
patch("/:id/close", meta("close_conversation", "Update"), ctrl.adminCloseHandler);
patch("/:id/reopen", meta("reopen_conversation", "Update"), ctrl.adminReopenHandler);

export default router;
