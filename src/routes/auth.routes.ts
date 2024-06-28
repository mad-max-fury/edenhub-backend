import express from "express";
import validateResource from "../middlewares/validateResource";
import { createUserSchema } from "../schemas/user.schemas";
import { createUserhandler } from "../controllers/user.controller";
import passport from "passport";

const router = express.Router();

// User signup route
router.post("/signup", validateResource(createUserSchema), createUserhandler);

// Google authentication route
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

// Google authentication callback route
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/?fd=failed",
  }),
  (req, res) => {
    res.redirect("http://localhost:3000/api/auth/profile");
  }
);

// User profile route
router.get("/profile", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("profile", { user: req.user });
  } else {
    res.redirect("/");
  }
});

export default router;
