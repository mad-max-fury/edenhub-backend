import express from "express";
import * as catalogCtrl from "../controllers/catalog.controller";

// Public storefront catalog — no auth, no permissions (guests can browse).
const router = express.Router();

router.get("/products", catalogCtrl.getCatalogProductsHandler);
router.get("/products/:id", catalogCtrl.getCatalogProductByIdHandler);
router.get("/categories", catalogCtrl.getCatalogCategoriesHandler);
router.get("/brands", catalogCtrl.getCatalogBrandsHandler);

export default router;
