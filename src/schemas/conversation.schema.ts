import { z } from "zod";

export const createConversationSchema = z.object({
  body: z.object({
    subject: z.string().min(1, "Subject is required").max(200),
    body: z.string().min(1, "Message body is required").max(5000),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    body: z.string().min(1, "Message body is required").max(5000),
  }),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>["body"];
export type SendMessageInput = z.infer<typeof sendMessageSchema>["body"];
