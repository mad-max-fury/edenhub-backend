import { array, number, object, string, TypeOf } from "zod";

export const createMenuSchema = object({
  body: object({
    title: string({ required_error: "Menu title is required" }),
    path: string({ required_error: "Frontend path is required" }),
    associatedClaims: array(string()).nonempty(
      "A menu must be linked to at least one claim",
    ),
    parentId: string().optional(),
    order: number().default(0),
  }),
});

export type CreateMenuInput = TypeOf<typeof createMenuSchema>["body"];
