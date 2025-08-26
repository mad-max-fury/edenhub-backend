"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const appError_1 = __importDefault(require("../errors/appError"));
const config_1 = __importDefault(require("config"));
const user_service_1 = require("../services/user.service");
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("../services/auth.service");
passport.use(new GoogleStrategy({
    clientID: config_1.default.get("googleClientId"),
    clientSecret: config_1.default.get("googleClientSecret"),
    callbackURL: `http://localhost:${config_1.default.get("port")}/${config_1.default.get("callbackURL")}`,
    scope: ["profile", "email"],
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    const newUser = {
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        password: profile.id,
    };
    try {
        let user = yield (0, user_service_1.findOneUser)({ email: newUser.email });
        if (user) {
            return done(null, user);
        }
        else {
            user = yield (0, auth_service_1.createUser)(newUser);
            return done(null, user);
        }
    }
    catch (err) {
        logger_1.default.error(err);
        return done(new appError_1.default(err.message, 500));
    }
})));
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield (0, user_service_1.getUserById)(id);
        if (user) {
            done(null, user);
        }
        else {
            done(new appError_1.default("User not found", 404));
        }
    }
    catch (err) {
        done(new appError_1.default(err.message, 500));
    }
}));
