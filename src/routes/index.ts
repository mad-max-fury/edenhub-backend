import express from "express";
import user from "./user.routes";
import auth from "./auth.routes";
import role from "./roles.routes";
import groups from "./groups.routes";
const router = express.Router();

router.get("/healthcheck", (_, res) => res.sendStatus(200));
router.use("/api/user/", user);
router.use("/api/auth/", auth);
router.use("/api/group/", groups);
router.use("/api/role/", role);

export default router;
