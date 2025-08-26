import express from "express";
import {
  deleteUserHandler,
  getAllUsersHandler,
  getUserByIdHandler,
  updateUserHandler,
} from "../controllers/user.controller";

import auth from "../middlewares/auth";

const router = express.Router();

router.get("/", auth, getAllUsersHandler);
router.get("/:id", auth, getUserByIdHandler);
router.patch("/:id", auth, updateUserHandler);
router.delete("/:id", auth, deleteUserHandler);

export default router;
