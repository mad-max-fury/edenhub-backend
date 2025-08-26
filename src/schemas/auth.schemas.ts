import { boolean, object, optional, string, TypeOf } from "zod";

export const createUserSchema = object({
  body: object({
    firstName: string({
      required_error: "firstName is required",
    }),
    lastName: string({
      required_error: "lastName is required",
    }),
    email: string({
      required_error: "email is required",
    }).email("Not a valid email address"),
    password: string({
      required_error: "password is required",
    }).min(6, "Password must be at least 6 characters"),
    confirmPassword: string({
      required_error: "confirmPassword is required",
    }),
    role: string()
      .optional()
      .default("user")
      .refine((val) => ["user", "admin", "sub-admin"].includes(val), {
        message: "Invalid role",
      }),
    phoneNumber: optional(
      string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number cannot exceed 15 digits")
    ),
    preferences: object({
      pushNotifications: boolean().default(false),
      emailNotifications: boolean().default(true),
      smsNotifications: boolean().default(true),
      marketingEmails: boolean().default(false),
    }).default({}),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
});

export const loginSchema = object({
  body: object({
    email: string({
      required_error: "Email is required",
    }).email("Invalid email format"),
    password: string({
      required_error: "Password is required",
    }).min(6, "Password must be at least 6 characters long"),
  }),
});

export const forgotPasswordSchema = object({
  body: object({
    email: string({
      required_error: "Email is required",
    }).email("Invalid email format"),
  }),
});

export const resetPasswordSchema = object({
  body: object({
    password: string({
      required_error: "Password is required",
    }).min(6, "Password must be at least 6 characters long"),
    passwordConfirmation: string({
      required_error: "Password confirmation is required",
    }),
  }).refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  }),
});

export const changePasswordSchema = object({
  body: object({
    currentPassword: string({
      required_error: "Current password is required",
    }),
    newPassword: string({
      required_error: "New password is required",
    }).min(6, "Password must be at least 6 characters long"),
    passwordConfirmation: string({
      required_error: "Password confirmation is required",
    }),
  }).refine((data) => data.newPassword === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  }),
});

export type CreateUserInputSchema = TypeOf<typeof createUserSchema>["body"];
export type ILoginInput = TypeOf<typeof loginSchema>["body"];
export type IForgotPasswordInput = TypeOf<typeof forgotPasswordSchema>["body"];
export type IResetPasswordInput = TypeOf<typeof resetPasswordSchema>["body"];
export type IChangePasswordInput = TypeOf<typeof changePasswordSchema>["body"];
