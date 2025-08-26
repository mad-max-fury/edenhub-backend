const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
import AppError from "../errors/appError";

import { User } from "../models/user.model";
import { findOneUser, getUserById } from "../services/user.service";
import log from "../utils/logger";
import { createUser } from "../services/auth.service";
import { getConfig } from "../config";

passport.use(
  new GoogleStrategy(
    {
      clientID: getConfig("googleClientId"),
      clientSecret: getConfig("googleClientSecret"),
      callbackURL: `http://localhost:${getConfig("port")}/${getConfig(
        "callbackURL"
      )}`,
      scope: ["profile", "email"],
    },
    async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      const newUser: Partial<User> = {
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        password: profile.id,
      };

      try {
        let user = await findOneUser({ email: newUser.email });

        if (user) {
          return done(null, user);
        } else {
          user = await createUser(newUser);

          return done(null, user);
        }
      } catch (err: any) {
        log.error(err);
        return done(new AppError(err.message, 500));
      }
    }
  )
);

passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await getUserById(id);
    if (user) {
      done(null, user);
    } else {
      done(new AppError("User not found", 404));
    }
  } catch (err: any) {
    done(new AppError(err.message, 500));
  }
});
