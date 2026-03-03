import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model";
import { findOneUser, getUserById } from "../services/user.service";
import { createUser } from "../services/auth.service";
import { findRoleByName } from "../services/role.service";
import { getConfig } from "../config";
import AppError from "../errors/appError";
import log from "../utils/logger";

passport.use(
  new GoogleStrategy(
    {
      clientID: getConfig("googleClientId") || "",
      clientSecret: getConfig("googleClientSecret") || "",
      callbackURL: getConfig("googleCallbackUrl"),
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(
            new AppError("Google account has no email associated", 400),
          );
        }

        let user = await findOneUser({ email });

        if (user) {
          return done(null, user);
        }

        const defaultRole = await findRoleByName("customer");

        const newUser = await createUser({
          firstName: profile.name?.givenName || "Google",
          lastName: profile.name?.familyName || "User",
          email: email,
          password: `google_${profile.id}`,
          role: defaultRole?._id,
          isVerified: true,
        });

        return done(null, newUser);
      } catch (err: any) {
        log.error("Google Strategy Error:", err);
        return done(err, false);
      }
    },
  ),
);

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await getUserById(id);
    if (!user) return done(null, false);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
