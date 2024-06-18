import express from "express";
import user from "./user.routes";
import auth from "./auth.routes";
const router = express.Router();

router.get("/healthcheck", (_, res) => res.sendStatus(200));
router.use("/api/user/", user);
router.use("/api/auth/", auth);

export default router;
