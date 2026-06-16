import express from "express";
import * as cartCtrl from "../controllers/cart.controller";
import auth from "../middlewares/auth";
import validateResource from "../middlewares/validateResource";
import {
  addCartItemSchema,
  cartItemParamSchema,
  updateCartItemSchema,
} from "../schemas/cart.schema";

// Authenticated customer cart (no admin permissions).
const router = express.Router();

router.use(auth);

router.get("/", cartCtrl.getCartHandler);
router.post("/items", validateResource(addCartItemSchema), cartCtrl.addCartItemHandler);
router.patch(
  "/items/:itemId",
  validateResource(updateCartItemSchema),
  cartCtrl.updateCartItemHandler,
);
router.delete(
  "/items/:itemId",
  validateResource(cartItemParamSchema),
  cartCtrl.removeCartItemHandler,
);
router.delete("/", cartCtrl.clearCartHandler);

export default router;
