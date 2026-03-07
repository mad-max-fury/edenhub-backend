import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import AppError from "../errors/appError";
import { s3Client } from "../utils/s3.utils";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getConfig } from "../config";
import sharp from "sharp";
import path from "path";

export const uploadResource = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.file) throw new AppError("No file uploaded", 400);

    const resourceType = (req.query?.type as string) || "general";
    const mimeTypeGroup = req.file.mimetype.split("/")[0] || "other";

    const subFolder =
      mimeTypeGroup === "application" ? "documents" : mimeTypeGroup;

    let fileBuffer = req.file.buffer;
    let contentType = req.file.mimetype;
    let originalName = path.parse(req.file.originalname).name;
    let extension = path.extname(req.file.originalname);

    if (req.file.mimetype.startsWith("image/")) {
      contentType = "image/webp";
      extension = ".webp";

      fileBuffer = await sharp(req.file.buffer)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    }

    const fileName = `${resourceType}/${subFolder}/${Date.now()}_${originalName}${extension}`;

    const bucketName = getConfig("awsBucketName");
    const region = getConfig("awsRegion");

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
        CacheControl: "max-age=31536000",
      }),
    );

    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;

    res.status(200).json({
      status: "success",
      data: {
        url: s3Url,
        key: fileName,
        mimetype: contentType,
        folder: resourceType,
        category: subFolder,
      },
    });
  },
);

export const deleteResource = catchAsync(
  async (req: Request, res: Response) => {
    const { key } = req.query;
    if (!key) throw new AppError("Resource key is required", 400);

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: getConfig("awsBucketName"),
        Key: key as string,
      }),
    );

    res.status(204).json({ status: "success", message: "resource deleted" });
  },
);

export const getResourceInfo = catchAsync(
  async (req: Request, res: Response) => {
    const { key } = req.query;
    if (!key) throw new AppError("Resource key is required", 400);

    try {
      const data = await s3Client.send(
        new HeadObjectCommand({
          Bucket: getConfig("awsBucketName"),
          Key: key as string,
        }),
      );

      res.status(200).json({
        status: "success",
        data: {
          key,
          contentType: data.ContentType,
          contentLength: data.ContentLength,
          lastModified: data.LastModified,
          metadata: data.Metadata,
        },
      });
    } catch (err: any) {
      if (err.name === "NotFound")
        throw new AppError("Resource not found", 404);
      throw err;
    }
  },
);
