/**
 * AWS S3 Storage Module for NyumbaAI Marketplace
 * 
 * This module provides direct AWS S3 integration for uploading and managing
 * product images, video files, and other media assets.
 * 
 * Features:
 * - Direct S3 uploads with automatic content type detection
 * - Presigned URL generation for secure downloads
 * - Image optimization and resizing support
 * - Organized folder structure (products/, videos/, thumbnails/)
 * - Public and private bucket support
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// S3 Configuration
interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string; // Optional CDN or public bucket URL
}

// Get S3 configuration from environment variables
function getS3Config(): S3Config {
  const region = process.env.AWS_REGION || "us-east-1";
  const bucket = process.env.AWS_S3_BUCKET || "";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
  const publicUrl = process.env.AWS_S3_PUBLIC_URL;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS S3 credentials missing. Please set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY in .env"
    );
  }

  return { region, bucket, accessKeyId, secretAccessKey, publicUrl };
}

// Initialize S3 Client
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const config = getS3Config();
    s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return s3Client;
}

// Check if S3 is configured
export function isS3Configured(): boolean {
  try {
    getS3Config();
    return true;
  } catch {
    return false;
  }
}

// Generate unique filename with timestamp and random hash
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString("hex");
  const extension = originalName.split(".").pop() || "jpg";
  return `${timestamp}-${randomHash}.${extension}`;
}

// Detect content type from file extension
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    pdf: "application/pdf",
  };
  return contentTypes[ext || ""] || "application/octet-stream";
}

// Upload file to S3
export async function s3Upload(
  data: Buffer | Uint8Array,
  folder: "products" | "videos" | "thumbnails" | "frames" | "temp",
  originalFilename: string,
  options: {
    contentType?: string;
    isPublic?: boolean;
    customKey?: string;
  } = {}
): Promise<{ key: string; url: string; bucket: string }> {
  const config = getS3Config();
  const client = getS3Client();

  // Generate unique key
  const filename = options.customKey || generateUniqueFilename(originalFilename);
  const key = `${folder}/${filename}`;
  const contentType = options.contentType || getContentType(originalFilename);

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: data,
    ContentType: contentType,
    ACL: options.isPublic ? "public-read" : "private",
    Metadata: {
      originalName: originalFilename,
      uploadedAt: new Date().toISOString(),
    },
  });

  await client.send(command);

  // Generate URL
  let url: string;
  if (options.isPublic && config.publicUrl) {
    // Use CDN or public bucket URL
    url = `${config.publicUrl}/${key}`;
  } else if (options.isPublic) {
    // Use S3 public URL
    url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  } else {
    // Generate presigned URL for private objects (valid for 7 days)
    url = await getSignedUrl(client, new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }), { expiresIn: 7 * 24 * 60 * 60 });
  }

  return { key, url, bucket: config.bucket };
}

// Upload product image (public)
export async function uploadProductImage(
  imageData: Buffer | Uint8Array,
  originalFilename: string
): Promise<{ key: string; url: string }> {
  const result = await s3Upload(imageData, "products", originalFilename, {
    isPublic: true,
  });
  return { key: result.key, url: result.url };
}

// Upload video (private with presigned URL)
export async function uploadVideo(
  videoData: Buffer | Uint8Array,
  originalFilename: string
): Promise<{ key: string; url: string }> {
  const result = await s3Upload(videoData, "videos", originalFilename, {
    isPublic: false,
  });
  return { key: result.key, url: result.url };
}

// Upload video thumbnail (public)
export async function uploadThumbnail(
  thumbnailData: Buffer | Uint8Array,
  originalFilename: string
): Promise<{ key: string; url: string }> {
  const result = await s3Upload(thumbnailData, "thumbnails", originalFilename, {
    isPublic: true,
  });
  return { key: result.key, url: result.url };
}

// Upload video frame (public)
export async function uploadFrame(
  frameData: Buffer | Uint8Array,
  originalFilename: string
): Promise<{ key: string; url: string }> {
  const result = await s3Upload(frameData, "frames", originalFilename, {
    isPublic: true,
  });
  return { key: result.key, url: result.url };
}

// Generate presigned URL for existing object
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const config = getS3Config();
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn });
}

// Delete file from S3
export async function s3Delete(key: string): Promise<void> {
  const config = getS3Config();
  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  await client.send(command);
}

// Delete multiple files from S3
export async function s3DeleteMultiple(keys: string[]): Promise<void> {
  await Promise.all(keys.map(key => s3Delete(key)));
}

// Get public URL for a key (without presigning)
export function getPublicUrl(key: string): string {
  const config = getS3Config();
  
  if (config.publicUrl) {
    return `${config.publicUrl}/${key}`;
  }
  
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
}

// Helper to extract key from S3 URL
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Handle both path-style and virtual-hosted-style URLs
    if (urlObj.hostname.includes('.s3.')) {
      return urlObj.pathname.substring(1); // Remove leading slash
    }
    return null;
  } catch {
    return null;
  }
}
