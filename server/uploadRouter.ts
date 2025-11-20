/**
 * Upload Router for DecorAI Marketplace
 * 
 * Handles file uploads for:
 * - Product images (vendors)
 * - Video files (customers)
 * - Thumbnails and frames
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { 
  isS3Configured, 
  uploadProductImage, 
  uploadVideo, 
  uploadThumbnail,
  uploadFrame,
  s3Delete,
  getPresignedUrl 
} from "./s3-storage";
import { storagePut } from "./storage";

// Vendor-only procedure
const vendorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'vendor' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Vendor access required' });
  }
  return next({ ctx });
});

export const uploadRouter = router({
  // Check if S3 is configured
  isS3Available: publicProcedure.query(() => {
    return { available: isS3Configured() };
  }),

  // Upload product image (vendor only)
  uploadProductImage: vendorProcedure
    .input(z.object({
      imageData: z.string(), // base64 encoded image
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate file size (max 5MB for images)
        if (input.fileSize > 5 * 1024 * 1024) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Image file size must be less than 5MB' 
          });
        }

        // Validate image type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const mimeType = input.mimeType || 'image/jpeg';
        if (!allowedTypes.includes(mimeType)) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Invalid image type. Only JPEG, PNG, and WebP are allowed.' 
          });
        }

        // Convert base64 to buffer
        const base64Data = input.imageData.includes(',') 
          ? input.imageData.split(',')[1] 
          : input.imageData;
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload to S3 or fallback storage
        let result;
        if (isS3Configured()) {
          result = await uploadProductImage(buffer, input.fileName);
        } else {
          // Fallback to built-in storage
          const key = `products/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          result = await storagePut(key, buffer, mimeType);
        }

        return { 
          success: true, 
          url: result.url, 
          key: result.key 
        };
      } catch (error) {
        console.error('[Upload] Product image upload failed:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Upload failed' 
        });
      }
    }),

  // Upload multiple product images
  uploadProductImages: vendorProcedure
    .input(z.object({
      images: z.array(z.object({
        imageData: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string().optional(),
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      
      for (const image of input.images) {
        try {
          // Validate file size
          if (image.fileSize > 5 * 1024 * 1024) {
            results.push({ 
              success: false, 
              fileName: image.fileName, 
              error: 'File too large' 
            });
            continue;
          }

          // Convert base64 to buffer
          const base64Data = image.imageData.includes(',') 
            ? image.imageData.split(',')[1] 
            : image.imageData;
          const buffer = Buffer.from(base64Data, 'base64');
          const mimeType = image.mimeType || 'image/jpeg';

          // Upload
          let result;
          if (isS3Configured()) {
            result = await uploadProductImage(buffer, image.fileName);
          } else {
            const key = `products/${ctx.user.id}/${Date.now()}-${image.fileName}`;
            result = await storagePut(key, buffer, mimeType);
          }

          results.push({ 
            success: true, 
            fileName: image.fileName,
            url: result.url, 
            key: result.key 
          });
        } catch (error) {
          console.error('[Upload] Image upload failed:', image.fileName, error);
          results.push({ 
            success: false, 
            fileName: image.fileName, 
            error: error instanceof Error ? error.message : 'Upload failed' 
          });
        }
      }

      return { results };
    }),

  // Upload video thumbnail
  uploadThumbnail: protectedProcedure
    .input(z.object({
      imageData: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.fileSize > 2 * 1024 * 1024) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Thumbnail size must be less than 2MB' 
          });
        }

        const buffer = Buffer.from(input.imageData.split(',')[1], 'base64');

        let result;
        if (isS3Configured()) {
          result = await uploadThumbnail(buffer, input.fileName);
        } else {
          const key = `thumbnails/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          result = await storagePut(key, buffer, 'image/jpeg');
        }

        return { 
          success: true, 
          url: result.url, 
          key: result.key 
        };
      } catch (error) {
        console.error('[Upload] Thumbnail upload failed:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Upload failed' 
        });
      }
    }),

  // Upload video frame
  uploadFrame: protectedProcedure
    .input(z.object({
      imageData: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.fileSize > 2 * 1024 * 1024) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Frame size must be less than 2MB' 
          });
        }

        const buffer = Buffer.from(input.imageData.split(',')[1], 'base64');

        let result;
        if (isS3Configured()) {
          result = await uploadFrame(buffer, input.fileName);
        } else {
          const key = `frames/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          result = await storagePut(key, buffer, 'image/jpeg');
        }

        return { 
          success: true, 
          url: result.url, 
          key: result.key 
        };
      } catch (error) {
        console.error('[Upload] Frame upload failed:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Upload failed' 
        });
      }
    }),

  // Delete uploaded file (vendor only for products)
  deleteFile: vendorProcedure
    .input(z.object({
      key: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        if (isS3Configured()) {
          await s3Delete(input.key);
        }
        // Note: Built-in storage doesn't support deletion via API
        return { success: true };
      } catch (error) {
        console.error('[Upload] File deletion failed:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to delete file' 
        });
      }
    }),

  // Get presigned URL for private content
  getPresignedUrl: protectedProcedure
    .input(z.object({
      key: z.string(),
      expiresIn: z.number().optional(), // seconds
    }))
    .query(async ({ input }) => {
      try {
        if (!isS3Configured()) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'S3 not configured' 
          });
        }

        const url = await getPresignedUrl(input.key, input.expiresIn);
        return { url };
      } catch (error) {
        console.error('[Upload] Presigned URL generation failed:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to generate presigned URL' 
        });
      }
    }),

  // Analyze room video (public for demo)
  analyzeRoomVideo: publicProcedure
    .input(z.object({
      videoData: z.string(), // base64 encoded video
      fileName: z.string(),
      fileSize: z.number(),
      preferences: z.object({
        budget: z.enum(['economy', 'mid-range', 'premium', 'luxury']),
        roomType: z.string(),
        favoriteColors: z.array(z.string()),
        stylePreference: z.string(),
        priorities: z.array(z.string()),
        spaceSize: z.enum(['small', 'medium', 'large'])
      })
    }))
    .mutation(async ({ input }) => {
      try {
        const { videoData, fileName, fileSize, preferences } = input;

        // Validate file size (max 50MB)
        if (fileSize > 50 * 1024 * 1024) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Video file too large. Maximum size is 50MB.' 
          });
        }

        // Import video processor and AI analyzer
        const { extractBestFrame, createThumbnail } = await import('./video-processor');
        const { analyzeRoom } = await import('./ai-analyzer');
        const fs = await import('fs/promises');
        const path = await import('path');

        // Create temp directory for processing
        const tempDir = path.join(process.cwd(), 'temp', Date.now().toString());
        await fs.mkdir(tempDir, { recursive: true });

        // Save video file
        const videoPath = path.join(tempDir, fileName);
        const videoBuffer = Buffer.from(videoData.split(',')[1], 'base64');
        await fs.writeFile(videoPath, videoBuffer);

        // Extract best frame for analysis
        const framePath = path.join(tempDir, 'analysis-frame.jpg');
        await extractBestFrame(videoPath, framePath);

        // Create thumbnail
        const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');
        await createThumbnail(videoPath, thumbnailPath, 400);

        // Analyze room with AI
        const analysis = await analyzeRoom(framePath, preferences);

        // Try to composite products onto room (optional - don't fail if this breaks)
        let compositeResult = null;
        try {
          const { matchRecommendationsToProducts, compositeProductsOntoRoom } = await import('./room-compositor');
          const { db } = await import('./db');
          
          const productImages = await matchRecommendationsToProducts(analysis.recommendations, db);
          
          // Composite products onto room image to create "after" visualization
          compositeResult = await compositeProductsOntoRoom(
            framePath,
            analysis.recommendations,
            productImages
          );
          console.log('✅ Room compositing successful');
        } catch (compError: any) {
          console.error('⚠️  Room compositing failed (non-fatal):', compError.message);
          console.error('Compositing error stack:', compError.stack);
          // Continue without compositing - just use the original frame
        }

        // Read frame and thumbnail as base64 for response
        const frameBuffer = await fs.readFile(framePath);
        const thumbnailBuffer = await fs.readFile(thumbnailPath);
        
        const frameBase64 = `data:image/jpeg;base64,${frameBuffer.toString('base64')}`;
        const thumbnailBase64 = `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;

        // Clean up temp files (optional - could keep for caching)
        // await fs.rm(tempDir, { recursive: true, force: true });

        return {
          success: true,
          analysis,
          frameUrl: frameBase64,
          thumbnailUrl: thumbnailBase64,
          afterImageUrl: compositeResult?.afterImageBase64 || frameBase64, // Fallback to original frame
          productPositions: compositeResult?.productPositions || [],
          videoId: Date.now().toString() // Simple ID for demo
        };
      } catch (error: any) {
        console.error('Video analysis error:', error);
        console.error('Error stack:', error.stack);
        
        // Return more specific error messages
        const errorMessage = error.message || 'Failed to analyze video. Please try again.';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
          cause: error
        });
      }
    }),

});
