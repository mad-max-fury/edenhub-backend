import { array, boolean, number, object, optional, string, TypeOf } from "zod";

/**
 * UPDATED: User Creation Schema
 * The role is no longer a hardcoded enum. It's now an optional string
 * (representing the Role ID). If not provided, the backend service
 * will assign the default "Customer" role.
 */
export const createUserSchema = object({
  body: object({
    firstName: string({ required_error: "firstName is required" }),
    lastName: string({ required_error: "lastName is required" }),
    email: string({ required_error: "email is required" }).email(
      "Not a valid email address",
    ),
    password: string({ required_error: "password is required" }).min(
      6,
      "Password must be at least 6 characters",
    ),
    confirmPassword: string({ required_error: "confirmPassword is required" }),
    role: string().optional(), // Now accepts a Role ID string
    phoneNumber: optional(
      string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number cannot exceed 15 digits"),
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

/**
 * NEW: Role Creation Schema
 * Used by Admin to define a new Role and attach Menus/Claims.
 */
export const createRoleSchema = object({
  body: object({
    name: string({ required_error: "Role name is required" }),
    menus: array(string()).default([]), // Array of Menu ObjectIds
    claims: array(string()).default([]), // Array of Claim ObjectIds
    isActive: boolean().default(true),
  }),
});

/**
 * NEW: Menu Creation Schema
 * Used by Admin to define a Sidebar item and link it to Claims.
 */
export const createMenuSchema = object({
  body: object({
    title: string({ required_error: "Menu title is required" }),
    path: string({ required_error: "Frontend path is required" }), // e.g., "/admin/inventory"
    associatedClaims: array(string()).nonempty(
      "A menu must be linked to at least one claim",
    ),
    parentId: string().optional(), // For nested menus
    order: number().default(0),
  }),
});

// --- Existing Auth Schemas ---

export const loginSchema = object({
  body: object({
    email: string({ required_error: "Email is required" }).email(
      "Invalid email format",
    ),
    password: string({ required_error: "Password is required" }).min(
      6,
      "Password must be at least 6 characters long",
    ),
  }),
});

export const forgotPasswordSchema = object({
  body: object({
    email: string({ required_error: "Email is required" }).email(
      "Invalid email format",
    ),
  }),
});

export const resetPasswordSchema = object({
  body: object({
    password: string({ required_error: "Password is required" }).min(
      6,
      "Password must be at least 6 characters long",
    ),
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
    currentPassword: string({ required_error: "Current password is required" }),
    newPassword: string({ required_error: "New password is required" }).min(
      6,
      "Password must be at least 6 characters long",
    ),
    passwordConfirmation: string({
      required_error: "Password confirmation is required",
    }),
  }).refine((data) => data.newPassword === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  }),
});

// Types
export type CreateUserInputSchema = TypeOf<typeof createUserSchema>["body"];
export type CreateRoleInput = TypeOf<typeof createRoleSchema>["body"];
export type CreateMenuInput = TypeOf<typeof createMenuSchema>["body"];
export type ILoginInput = TypeOf<typeof loginSchema>["body"];
export type IForgotPasswordInput = TypeOf<typeof forgotPasswordSchema>["body"];
export type IResetPasswordInput = TypeOf<typeof resetPasswordSchema>["body"];
export type IChangePasswordInput = TypeOf<typeof changePasswordSchema>["body"];
