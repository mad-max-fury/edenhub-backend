"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = (0, zod_1.object)({
    body: (0, zod_1.object)({
        firstName: (0, zod_1.string)({
            required_error: "firstName is required",
        }),
        lastName: (0, zod_1.string)({
            required_error: "lastName is required",
        }),
        email: (0, zod_1.string)({
            required_error: "email is required",
        }).email("Not a valid email address"),
        password: (0, zod_1.string)({
            required_error: "password is required",
        }).min(6, "Password must be at least 6 characters"),
        confirmPassword: (0, zod_1.string)({
            required_error: "confirmPassword is required",
        }),
        role: (0, zod_1.string)()
            .optional()
            .default("user")
            .refine((val) => ["user", "admin", "sub-admin"].includes(val), {
            message: "Invalid role",
        }),
        phoneNumber: (0, zod_1.optional)((0, zod_1.string)()
            .min(10, "Phone number must be at least 10 digits")
            .max(15, "Phone number cannot exceed 15 digits")),
        preferences: (0, zod_1.object)({
            pushNotifications: (0, zod_1.boolean)().default(false),
            emailNotifications: (0, zod_1.boolean)().default(true),
            smsNotifications: (0, zod_1.boolean)().default(true),
            marketingEmails: (0, zod_1.boolean)().default(false),
        }).default({}),
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    }),
});
exports.loginSchema = (0, zod_1.object)({
    body: (0, zod_1.object)({
        email: (0, zod_1.string)({
            required_error: "Email is required",
        }).email("Invalid email format"),
        password: (0, zod_1.string)({
            required_error: "Password is required",
        }).min(6, "Password must be at least 6 characters long"),
    }),
});
exports.forgotPasswordSchema = (0, zod_1.object)({
    body: (0, zod_1.object)({
        email: (0, zod_1.string)({
            required_error: "Email is required",
        }).email("Invalid email format"),
    }),
});
exports.resetPasswordSchema = (0, zod_1.object)({
    body: (0, zod_1.object)({
        password: (0, zod_1.string)({
            required_error: "Password is required",
        }).min(6, "Password must be at least 6 characters long"),
        passwordConfirmation: (0, zod_1.string)({
            required_error: "Password confirmation is required",
        }),
    }).refine((data) => data.password === data.passwordConfirmation, {
        message: "Passwords do not match",
        path: ["passwordConfirmation"],
    }),
});
exports.changePasswordSchema = (0, zod_1.object)({
    body: (0, zod_1.object)({
        currentPassword: (0, zod_1.string)({
            required_error: "Current password is required",
        }),
        newPassword: (0, zod_1.string)({
            required_error: "New password is required",
        }).min(6, "Password must be at least 6 characters long"),
        passwordConfirmation: (0, zod_1.string)({
            required_error: "Password confirmation is required",
        }),
    }).refine((data) => data.newPassword === data.passwordConfirmation, {
        message: "Passwords do not match",
        path: ["passwordConfirmation"],
    }),
});
