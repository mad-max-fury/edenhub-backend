import multer from "multer";

import AppError from "../errors/appError";

const storage = multer.memoryStorage();

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/bmp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const uploadMiddleware = multer({
  storage,
  fileFilter: (_req: any, file: any, cb: any) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(`File type (${file.mimetype}) not supported`, 400) as any,
        false,
      );
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});
