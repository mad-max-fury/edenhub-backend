import express from "express";
const router = express.Router();
import validateResource from "../middlewares/validateResource";
import { createUserSchema } from "../schemas/user.schemas";
import { createUserhandler } from "../controllers/user.controller";
router.post("/signup", validateResource(createUserSchema), createUserhandler);

export default router;
