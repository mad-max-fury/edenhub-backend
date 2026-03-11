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
