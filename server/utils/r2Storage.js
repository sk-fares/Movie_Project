import fs from 'fs';
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
};

export const isR2Configured = () => {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
};

/**
 * Uploads a file from local disk to Cloudflare R2 bucket with multipart streaming
 */
export const uploadFileToR2 = async (localFilePath, remoteKey, mimeType) => {
  const s3 = getR2Client();
  if (!s3) throw new Error('Cloudflare R2 is not configured');

  const fileStream = fs.createReadStream(localFilePath);
  const bucketName = process.env.R2_BUCKET_NAME;

  const parallelUpload = new Upload({
    client: s3,
    params: {
      Bucket: bucketName,
      Key: remoteKey,
      Body: fileStream,
      ContentType: mimeType
    },
    queueSize: 4,
    partSize: 10 * 1024 * 1024 // 10MB chunks
  });

  await parallelUpload.done();

  // If public domain configured, return full CDN URL
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (publicDomain) {
    const cleanDomain = publicDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${cleanDomain}/${remoteKey}`;
  }

  return remoteKey;
};

/**
 * Deletes an object from Cloudflare R2
 */
export const deleteFileFromR2 = async (remoteKey) => {
  const s3 = getR2Client();
  if (!s3 || !remoteKey) return;

  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: remoteKey
      })
    );
    console.log(`[R2] Deleted file: ${remoteKey}`);
  } catch (err) {
    console.error(`[R2] Failed to delete file (${remoteKey}):`, err.message);
  }
};

/**
 * Streams an object from Cloudflare R2 supporting Range headers
 */
export const getR2ObjectStream = async (remoteKey, rangeHeader) => {
  const s3 = getR2Client();
  if (!s3) throw new Error('Cloudflare R2 is not configured');

  const bucketName = process.env.R2_BUCKET_NAME;
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: remoteKey,
    Range: rangeHeader || undefined
  });

  return await s3.send(command);
};
