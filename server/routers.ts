import { z } from "zod";
import type { InsertVideoAnalysis } from "../drizzle/schema";
type BudgetTier = InsertVideoAnalysis["budgetTier"];
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import * as db from "./db";
import { analyzeRoomPhoto } from "./videoAnalysis"; // Changed from analyzeRoomVideo
import { orderRouter, paymentRouter } from "./orderRouters";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Vendor-only procedure
const vendorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "vendor" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Vendor access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // User & Vendor Management
  user: router({
    becomeVendor: protectedProcedure
      .input(
        z.object({
          businessName: z.string(),
          businessDescription: z.string(),
          businessCategory: z.enum([
            "furniture",
            "art",
            "plants",
            "lighting",
            "textiles",
            "decor",
            "other",
          ]),
          businessPhone: z.string(),
          businessAddress: z.string(),
          businessCity: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateUserVendorStatus(ctx.user.id, {
          isVendor: true,
          ...input,
        });
        return { success: true };
      }),

    getVendorProfile: publicProcedure
      .input(z.object({ vendorId: z.number() }))
      .query(async ({ input }) => {
        const vendor = await db.getUserById(input.vendorId);
        if (!vendor || !vendor.isVendor) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found" });
        }
        return vendor;
      }),

    getAllVendors: publicProcedure.query(async () => {
      return db.getAllVendors();
    }),
  }),

  // Photo Upload & Analysis (Previously Video)
  photo: router({
    uploadPhoto: protectedProcedure // Changed from uploadVideo
      .input(
        z.object({
          photoData: z.string(), // Changed from videoData
          fileName: z.string(),
          fileSize: z.number(),
          mimeType: z.string(),
          budgetTier: z
            .enum(["economy", "mid-range", "premium", "luxury"])
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        let photoId = 0; // Changed from videoId
        let photoUrl = ""; // Changed from videoUrl

        try {
          // Validate file size (max 16MB)
          if (input.fileSize > 16 * 1024 * 1024) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Photo file size must be less than 16MB",
            });
          }

          const buffer = Buffer.from(input.photoData.split(",")[1], "base64");

          const photoKey = `photos/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          const uploadResult = await storagePut(photoKey, buffer, input.mimeType);
          photoUrl = uploadResult.url;

          // We still use the 'videos' table for simplicity, just treating it as 'media'
          const result = await db.createVideo({
            userId: ctx.user.id,
            videoUrl: photoUrl, // Storing photo URL here
            videoKey: photoKey,
            fileSize: input.fileSize,
            status: "processing",
          });

          if (Array.isArray(result) && result[0]) {
            photoId = Number(result[0].insertId);
          } else if ((result as any).insertId) {
            photoId = Number((result as any).insertId);
          }

          if (!photoId || isNaN(photoId) || photoId <= 0) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create photo record",
            });
          }

          // Start analysis asynchronously
          analyzeRoomPhoto(photoId, ctx.user.id, photoUrl, input.budgetTier).catch(
            (err) => {
              console.error("[Photo] Analysis failed:", err);
            }
          );

          return { photoId, photoUrl };
        } catch (error) {
          console.error("[Photo Upload] Error in mutation:", error);
          throw error;
        }
      }),

    getMyPhotos: protectedProcedure.query(async ({ ctx }) => {
      return db.getVideosByUser(ctx.user.id); // Still gets from 'videos' table
    }),

    getPhotoAnalysis: protectedProcedure
      .input(z.object({ photoId: z.number() })) // Changed from videoId
      .query(async ({ ctx, input }) => {
        const photo = await db.getVideoById(input.photoId);
        if (!photo || photo.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Photo not found" });
        }

        const analysis = await db.getVideoAnalysisByVideoId(input.photoId);
        return { photo, analysis };
      }),
  }),

  // Product Management
  product: router({
    create: vendorProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          category: z.enum([
            "furniture",
            "art",
            "plants",
            "lighting",
            "textiles",
            "decor",
            "other",
          ]),
          subCategory: z.string().optional(),
          priceKES: z.number(),
          stockQuantity: z.number(),
          imageUrls: z.array(z.string()),
          dimensions: z.string().optional(),
          material: z.string().optional(),
          color: z.string().optional(),
          style: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.createProduct({
          vendorId: ctx.user.id,
          ...input,
          imageUrls: JSON.stringify(input.imageUrls),
          currency: "KES",
        });
        return { productId: result ? Number((result as any).insertId) : 0 };
      }),

    update: vendorProcedure
      .input(
        z.object({
          productId: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          category: z
            .enum([
              "furniture",
              "art",
              "plants",
              "lighting",
              "textiles",
              "decor",
              "other",
            ])
            .optional(),
          subCategory: z.string().optional(),
          priceKES: z.number().optional(),
          stockQuantity: z.number().optional(),
          imageUrls: z.array(z.string()).optional(),
          isActive: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product || product.vendorId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Product not found" });
        }
        await db.updateProduct(input.productId, input);
        return { success: true };
      }),

    delete: vendorProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product || product.vendorId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Product not found" });
        }
        await db.deleteProduct(input.productId);
        return { success: true };
      }),

    getMyProducts: vendorProcedure.query(async ({ ctx }) => {
      return db.getProductsByVendor(ctx.user.id);
    }),

    getById: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return db.getProductById(input.productId);
      }),

    getAll: publicProcedure.query(async () => {
      return db.getAllProducts({ isActive: true });
    }),

    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return db.searchProducts(input.query);
      }),
  }),

  // Order & Payment Management
  order: orderRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
