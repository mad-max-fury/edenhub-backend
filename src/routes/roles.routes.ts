import express from "express";
import validateResource from "../middlewares/validateResource";
import {
  deleteMenuHandler,
  updateMenuHandler,
} from "../controllers/menu.controller";
import auth from "../middlewares/auth";
import { hasClaim } from "../middlewares/hasClaim";

const router = express.Router();

router.post(
  "/menus",
  auth,
  hasClaim,
  validateResource(createUserSchema),
  createMenuHandler,
);
router.get(
  "/menus/tree",
  auth,
  hasClaim,
  validateResource(createUserSchema),
  getMenuTreeHandler,
);
router.patch(
  "/menus/:id",
  auth,
  hasClaim,
  validateResource(createUserSchema),
  updateMenuHandler,
);
router.delete(
  "/menus/:id",
  auth,
  hasClaim,
  validateResource(createUserSchema),
  deleteMenuHandler,
);

export default router;
