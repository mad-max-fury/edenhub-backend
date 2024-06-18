import { object, string, TypeOf } from "zod";

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
    role: string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
});

export type CreateUserInputSchema = TypeOf<typeof createUserSchema>["body"];
