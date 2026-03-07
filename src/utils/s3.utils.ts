import { S3Client } from "@aws-sdk/client-s3";
import { getConfig } from "../config";

export const s3Client = new S3Client({
  region: getConfig("awsRegion"),
  credentials: {
    accessKeyId: getConfig("awsAccessKey"),
    secretAccessKey: getConfig("awsSecretKey"),
  },
});
