import * as analyticsCtrl from "../controllers/analytics.controller";
import auth from "../middlewares/auth";
import { hasPermission } from "../middlewares/hasPermissions";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, get } = createAttributeRouter();

const GROUP = "Analytics";

router.use(auth);

const read = (name: string) => ({
  resource: "Analytics",
  action: "Read" as const,
  group: GROUP,
  name,
});

get("/summary", read("get_analytics_summary"), hasPermission, analyticsCtrl.getSummaryHandler);
get(
  "/sales-timeseries",
  read("get_analytics_sales_timeseries"),
  hasPermission,
  analyticsCtrl.getSalesTimeseriesHandler,
);
get(
  "/top-products",
  read("get_analytics_top_products"),
  hasPermission,
  analyticsCtrl.getTopProductsHandler,
);
get(
  "/sales-by-category",
  read("get_analytics_sales_by_category"),
  hasPermission,
  analyticsCtrl.getSalesByCategoryHandler,
);
get(
  "/recent-orders",
  read("get_analytics_recent_orders"),
  hasPermission,
  analyticsCtrl.getRecentOrdersHandler,
);
get(
  "/product/:id",
  read("get_analytics_product"),
  hasPermission,
  analyticsCtrl.getProductAnalyticsHandler,
);

export default router;
