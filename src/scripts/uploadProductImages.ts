/**
 * Uploads all product images from ~/Desktop/product-images/ to S3,
 * then updates products-seed.json with the S3 URLs mapped to each product.
 *
 * Run:  npx ts-node --transpile-only src/scripts/uploadProductImages.ts
 */

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const IMAGES_DIR = path.join(
  process.env.HOME || "/Users/endee",
  "Desktop/product-images",
);
const PRODUCTS_JSON = path.join(
  process.env.HOME || "/Users/endee",
  "Desktop/products-seed.json",
);

const BUCKET = process.env.awsBucketName!;
const REGION = process.env.awsRegion!;
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.awsAccessKey!,
    secretAccessKey: process.env.awsSecretKey!,
  },
});

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"]);

async function uploadImage(
  localPath: string,
  s3Key: string,
): Promise<string> {
  let buffer = fs.readFileSync(localPath);
  let contentType = "image/webp";
  const ext = path.extname(localPath).toLowerCase();

  // Convert raster images to webp for size optimization
  if ([".jpg", ".jpeg", ".png", ".bmp"].includes(ext)) {
    buffer = await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } else if (ext === ".gif") {
    contentType = "image/gif";
  } else if (ext === ".webp") {
    contentType = "image/webp";
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "max-age=31536000",
    }),
  );

  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  if (!BUCKET || !REGION) {
    console.error("Set awsBucketName, awsRegion, awsAccessKey, awsSecretKey in .env");
    process.exit(1);
  }

  // Load products JSON
  const productsData = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf-8"));
  const products: any[] = productsData.products;

  // Build a map: folder-name → product index
  // Match by normalizing both the folder name and product name
  const productMap = new Map<string, number>();
  products.forEach((p: any, i: number) => {
    productMap.set(slugify(p.name), i);
  });

  // Walk the image directories
  const categories = fs.readdirSync(IMAGES_DIR).filter((f) =>
    fs.statSync(path.join(IMAGES_DIR, f)).isDirectory(),
  );

  let totalUploaded = 0;
  let totalMapped = 0;

  for (const cat of categories) {
    const catDir = path.join(IMAGES_DIR, cat);
    const productFolders = fs.readdirSync(catDir).filter((f) =>
      fs.statSync(path.join(catDir, f)).isDirectory(),
    );

    for (const folder of productFolders) {
      const folderPath = path.join(catDir, folder);
      const imageFiles = fs.readdirSync(folderPath).filter((f) => {
        const ext = path.extname(f).toLowerCase();
        return IMAGE_EXTS.has(ext) && !f.startsWith(".");
      });

      if (imageFiles.length === 0) continue;

      // Find matching product
      const folderSlug = slugify(folder);
      let productIdx = productMap.get(folderSlug);

      // Try partial match if exact match fails
      if (productIdx === undefined) {
        for (const [key, idx] of productMap.entries()) {
          if (folderSlug.includes(key) || key.includes(folderSlug)) {
            productIdx = idx;
            break;
          }
        }
      }

      // Upload images
      const urls: string[] = [];
      for (const imgFile of imageFiles.sort()) {
        const imgPath = path.join(folderPath, imgFile);
        const ext = path.extname(imgFile).toLowerCase();
        const outExt = [".jpg", ".jpeg", ".png", ".bmp"].includes(ext)
          ? ".webp"
          : ext;
        const s3Key = `products/${cat}/${folderSlug}/${Date.now()}-${slugify(path.parse(imgFile).name)}${outExt}`;

        try {
          const url = await uploadImage(imgPath, s3Key);
          urls.push(url);
          totalUploaded++;
          process.stdout.write(".");
        } catch (err: any) {
          console.error(`\n  Failed: ${imgPath}: ${err.message}`);
        }
      }

      // Map to product
      if (productIdx !== undefined && urls.length > 0) {
        products[productIdx].coverImage = urls[0];
        products[productIdx].images = urls.slice(1);
        totalMapped++;
      } else if (urls.length > 0) {
        console.log(`\n  No product match for folder: ${cat}/${folder}`);
      }
    }
  }

  // Save updated products JSON
  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(productsData, null, 2));

  console.log(`\n\nDone!`);
  console.log(`  Uploaded: ${totalUploaded} images`);
  console.log(`  Mapped to products: ${totalMapped}`);
  console.log(`  Output: ${PRODUCTS_JSON}`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
