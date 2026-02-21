import { array, number, object, string, TypeOf, optional } from "zod";

export const updateGroupSchema = object({
  params: object({
    id: string({ required_error: "Group ID is required" }),
  }),
  body: object({
    name: string().optional(),
    path: string().optional(),
    icon: string().optional(),
    order: number().optional(),
    permissions: array(string()).optional(),
  }),
});

export const createGroupSchema = object({
  body: object({
    name: string({ required_error: "Group name is required" }),
    path: string({ required_error: "Path is required" }),
    icon: string().optional(),
    order: number().default(0),
    permissions: array(string()).default([]),
  }),
});

export type UpdateGroupInput = TypeOf<typeof updateGroupSchema>["body"];
export type CreateGroupInput = TypeOf<typeof createGroupSchema>["body"];
export type GroupParamsInput = TypeOf<typeof updateGroupSchema>["params"];
