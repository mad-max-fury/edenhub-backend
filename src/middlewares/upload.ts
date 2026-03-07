import multer from "multer";

import AppError from "../errors/appError";

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "video/mp4",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(`File type(${file.mimetype}) not supported`, 400) as any,
        false,
      );
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});
