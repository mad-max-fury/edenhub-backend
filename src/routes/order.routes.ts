import * as orderCtrl from "../controllers/order.controller";
import auth from "../middlewares/auth";
import validateResource from "../middlewares/validateResource";
import { hasPermission } from "../middlewares/hasPermissions";
import {
  createOrderSchema,
  fetchRatesSchema,
  orderIdParamSchema,
  refundOrderSchema,
  shipOrderSchema,
  updateFulfillmentSchema,
  updatePaymentSchema,
  updateStatusSchema,
} from "../schemas/order.schema";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, post, get, patch, delete: destroy } = createAttributeRouter();

const GROUP = "Order Management";

router.use(auth);

post(
  "/rates",
  {
    resource: "Order",
    action: "Read",
    group: GROUP,
    name: "post_order_rates",
  },
  validateResource(fetchRatesSchema),
  orderCtrl.fetchRatesHandler,
);

post(
  "/",
  {
    resource: "Order",
    action: "Write",
    group: GROUP,
    name: "post_order_create",
  },
  // validateResource(createOrderSchema),
  orderCtrl.createOrderHandler,
);

router.get("/me", orderCtrl.getMyOrdersHandler);
router.get("/me/:id", orderCtrl.getMyOrderHandler);
router.post("/me/:id/verify", orderCtrl.verifyMyOrderHandler);
router.post("/me/:id/cancel", orderCtrl.cancelMyOrderHandler);

get(
  "/",
  {
    resource: "Order",
    action: "Read",
    group: GROUP,
    name: "get_orders_list",
  },
  hasPermission,
  orderCtrl.getOrdersHandler,
);

get(
  "/stats",
  {
    resource: "Order",
    action: "Read",
    group: GROUP,
    name: "get_order_stats",
  },
  hasPermission,
  orderCtrl.getOrderStatsHandler,
);

post(
  "/reconcile-pending",
  {
    resource: "Order",
    action: "Update",
    group: GROUP,
    name: "post_order_reconcile_pending",
  },
  hasPermission,
  orderCtrl.reconcilePendingHandler,
);

get(
  "/:id",
  {
    resource: "Order",
    action: "Read",
    group: GROUP,
    name: "get_order_by_id",
  },
  hasPermission,
  validateResource(orderIdParamSchema),
  orderCtrl.getOrderByIdHandler,
);

patch(
  "/:id/status",
  {
    resource: "Order",
    action: "Update",
    group: GROUP,
    name: "patch_order_status",
  },
  hasPermission,
  validateResource(updateStatusSchema),
  orderCtrl.updateStatusHandler,
);

patch(
  "/:id/payment",
  {
    resource: "Order",
    action: "Update",
    group: GROUP,
    name: "patch_order_payment",
  },
  hasPermission,
  validateResource(updatePaymentSchema),
  orderCtrl.updatePaymentHandler,
);

patch(
  "/:id/fulfillment",
  {
    resource: "Order",
    action: "Update",
    group: GROUP,
    name: "patch_order_fulfillment",
  },
  hasPermission,
  validateResource(updateFulfillmentSchema),
  orderCtrl.updateFulfillmentHandler,
);

post(
  "/:id/verify",
  {
    resource: "Order",
    action: "Update",
    group: GROUP,
    name: "post_order_verify",
  },
  hasPermission,
  validateResource(orderIdParamSchema),
  orderCtrl.verifyPaymentHandler,
);

post(
  "/:id/refund",
  {
    resource: "Order",
    action: "Update",
    group: GROUP,
    name: "post_order_refund",
  },
  hasPermission,
  validateResource(refundOrderSchema),
  orderCtrl.refundOrderHandler,
);

post(
  "/:id/ship",
  {
    resource: "Order",
    action: "Update",
    group: GROUP,
    name: "post_order_ship",
  },
  hasPermission,
  validateResource(shipOrderSchema),
  orderCtrl.shipOrderHandler,
);

post(
  "/:id/track",
  {
    resource: "Order",
    action: "Read",
    group: GROUP,
    name: "post_order_track",
  },
  hasPermission,
  validateResource(orderIdParamSchema),
  orderCtrl.trackOrderHandler,
);

destroy(
  "/:id",
  {
    resource: "Order",
    action: "Delete",
    group: GROUP,
    name: "delete_order_cancel",
  },
  hasPermission,
  validateResource(orderIdParamSchema),
  orderCtrl.cancelOrderHandler,
);

export default router;
