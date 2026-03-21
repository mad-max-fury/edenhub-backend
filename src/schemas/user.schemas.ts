import { object, string, boolean, TypeOf, optional } from "zod";
export const changePasswordSchema = object({
  body: object({
    currentPassword: string().min(1, "Current password is required"),
    newPassword: string().min(
      8,
      "New password must be at least 8 characters long",
    ),
    confirmPassword: string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
});
export type IChangePasswordInput = TypeOf<typeof changePasswordSchema>["body"];

export const paginationSchema = object({
  query: object({
    pageNumber: string()
      .optional()
      .transform((val) => parseInt(val || "1")),
    pageSize: string()
      .optional()
      .transform((val) => parseInt(val || "10")),
    searchTerm: string().optional(),
    orderBy: string().optional(),
  }),
});

export const IOnboardUserSchema = object({
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
    role: string({ required_error: "Role is required" }),
  }),
});
