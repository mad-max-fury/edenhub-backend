import { array, boolean, object, string, TypeOf } from "zod";

const roleGroupSchema = object({
  id: string({ required_error: "Group ID is required" }),
  permissionsId: array(string()).default([]),
});

export const createRoleSchema = object({
  body: object({
    name: string({ required_error: "Role name is required" }),
    groups: array(roleGroupSchema).default([]),
    permissions: array(string()).default([]),
    isActive: boolean().optional().default(true),
  }),
});

export const updateRoleSchema = object({
  params: object({
    id: string({ required_error: "Role ID is required" }),
  }),
  body: object({
    name: string().optional(),
    groups: array(roleGroupSchema).optional(),
    permissions: array(string()).optional(),
    isActive: boolean().optional(),
  }),
});

export const roleParamsSchema = object({
  params: object({
    id: string({ required_error: "Role ID is required" }),
  }),
});

export type CreateRoleInput = TypeOf<typeof createRoleSchema>["body"];
export type UpdateRoleInput = TypeOf<typeof updateRoleSchema>["body"];
export type RoleParamsInput = TypeOf<typeof roleParamsSchema>["params"];
