import { array, boolean, number, object, optional, string, TypeOf } from "zod";

export const createRoleSchema = object({
  body: object({
    name: string({ required_error: "Role name is required" }),
    menus: array(string()).default([]),
    claims: array(string()).default([]),
    isActive: boolean().default(true),
  }),
});

export type CreateRoleInput = TypeOf<typeof createRoleSchema>["body"];
