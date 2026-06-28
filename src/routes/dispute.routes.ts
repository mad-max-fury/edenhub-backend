import * as ctrl from "../controllers/dispute.controller";
import auth from "../middlewares/auth";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, get, post, patch } = createAttributeRouter();
const GROUP = "Disputes";
const meta = (name: string, action: "Read" | "Write" | "Update") => ({
  resource: "Dispute", action, group: GROUP, name,
});

router.use(auth);

// Customer (storefront)
post("/me", meta("create_dispute", "Write"), ctrl.customerCreateHandler);
get("/me", meta("list_my_disputes", "Read"), ctrl.customerListHandler);
get("/me/:id", meta("get_my_dispute", "Read"), ctrl.customerGetHandler);
post("/me/:id/message", meta("message_my_dispute", "Write"), ctrl.customerMessageHandler);
patch("/me/:id/close", meta("close_my_dispute", "Update"), ctrl.customerCloseHandler);

// Admin
get("/", meta("list_all_disputes", "Read"), ctrl.adminListHandler);
get("/:id", meta("get_dispute", "Read"), ctrl.adminGetHandler);
post("/:id/message", meta("message_dispute", "Write"), ctrl.adminMessageHandler);
patch("/:id/status", meta("update_dispute_status", "Update"), ctrl.adminUpdateStatusHandler);
post("/:id/refund", meta("refund_dispute", "Write"), ctrl.adminRefundHandler);

export default router;
