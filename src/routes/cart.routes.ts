import * as cartCtrl from "../controllers/cart.controller";
import auth from "../middlewares/auth";
import validateResource from "../middlewares/validateResource";
import { createAttributeRouter } from "../utils/routeBuilder.utils";
import {
  addCartItemSchema,
  cartItemParamSchema,
  updateCartItemSchema,
} from "../schemas/cart.schema";

// Authenticated customer cart (self-service — no admin permission gate).
const { router, get, post, patch, delete: destroy } = createAttributeRouter();

const GROUP = "Cart Management";
const meta = (
  name: string,
  action: "Read" | "Write" | "Update" | "Delete",
) => ({ resource: "Cart", action, group: GROUP, name });

router.use(auth);

get("/", meta("get_cart", "Read"), cartCtrl.getCartHandler);
post(
  "/items",
  meta("post_cart_add_item", "Write"),
  validateResource(addCartItemSchema),
  cartCtrl.addCartItemHandler,
);
patch(
  "/items/:itemId",
  meta("patch_cart_update_item", "Update"),
  validateResource(updateCartItemSchema),
  cartCtrl.updateCartItemHandler,
);
destroy(
  "/items/:itemId",
  meta("delete_cart_item", "Delete"),
  validateResource(cartItemParamSchema),
  cartCtrl.removeCartItemHandler,
);
destroy("/", meta("delete_cart_clear", "Delete"), cartCtrl.clearCartHandler);

export default router;
