import * as catalogCtrl from "../controllers/catalog.controller";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

// Public storefront catalog — no auth, no permission gate (guests can browse).
const { router, get } = createAttributeRouter();

const GROUP = "Catalog";
const read = (name: string) => ({
  resource: "Catalog",
  action: "Read" as const,
  group: GROUP,
  name,
});

get("/products", read("get_catalog_products"), catalogCtrl.getCatalogProductsHandler);
get(
  "/products/:id",
  read("get_catalog_product_by_id"),
  catalogCtrl.getCatalogProductByIdHandler,
);
get(
  "/categories",
  read("get_catalog_categories"),
  catalogCtrl.getCatalogCategoriesHandler,
);
get("/brands", read("get_catalog_brands"), catalogCtrl.getCatalogBrandsHandler);

export default router;
