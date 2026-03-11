import { z } from "zod";

const MAX_DOC_SIZE = 10 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
  "application/json",
];

const ALL_ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_DOC_TYPES];

export const fileUploadSchema = z.object({
  file: z.object(
    {
      fieldname: z.string(),
      originalname: z.string(),
      encoding: z.string(),
      mimetype: z.string().refine((type) => ALL_ACCEPTED_TYPES.includes(type), {
        message:
          "Unsupported file format. Please upload an image, PDF, or ZIP.",
      }),
      size: z.number().refine((size) => size <= MAX_DOC_SIZE, {
        message: "File is too large. Max limit is 20MB.",
      }),
      buffer: z.any().optional(),
    },
    {
      required_error:
        "No file was uploaded. Ensure the form-data key is named 'file'.",
    },
  ),

  query: z.object({
    type: z.enum(
      ["products", "profiles", "brands", "categories", "documents"],
      {
        errorMap: () => ({
          message:
            "Query parameter 'type' is required and must be a valid resource folder.",
        }),
      },
    ),
  }),

  body: z.any().optional(),
  params: z.any().optional(),
});

export const multipleFilesSchema = z.object({
  files: z
    .array(fileUploadSchema.shape.file)
    .min(1, "At least one file is required"),
  query: fileUploadSchema.shape.query,
});

export type FileUploadInput = z.infer<typeof fileUploadSchema>;
