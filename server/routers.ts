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
        uploadPhoto: publicProcedure // TEMPORARY FIX FOR DEMO
      .input(
        z.object({
          photoData: z.string(), // Changed from videoData
          fileName: z.string(),
          fileSize: z.number(),
          mimeType: z.string(),
          budgetTier: z.enum(["economy", "mid-range", "premium", "luxury"]).optional(),
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

                    // Bypass S3 for demo flow
          const photoKey = `photos/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          photoUrl = `https://demo-photo-storage.com/${photoKey}`; // Placeholder URL

          // NOTE: In a real app, you would upload the photo here.
          // For now, we skip the S3 upload to avoid the missing credentials error.


          // 2. Create initial photo record in DB
          const photoRecord = await db.createPhoto({
            userId: ctx.user.id,
            photoUrl,
            status: "processing",
            budgetTier: input.budgetTier,
          });
          photoId = photoRecord.id;

          // 3. Start AI analysis (non-blocking)
          analyzeRoomPhoto(photoId, ctx.user.id, photoUrl, input.budgetTier).catch(
            (error) => {
              console.error("AI Analysis failed for photo:", photoId, error);
              db.updatePhotoStatus(photoId, "failed");
            }
          );

          return { photoId, photoUrl };
        } catch (error) {
          console.error("Error in uploadPhoto mutation:", error);
          if (photoId > 0) {
            db.updatePhotoStatus(photoId, "failed");
          }
          throw error;
        }
      }),

    getPhotoAnalysis: publicProcedure // <--- FIX: Changed to publicProcedure
      .input(z.object({ photoId: z.number() }))
      .query(async ({ input }) => {
        const photo = await db.getPhotoById(input.photoId);
        if (!photo) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Photo not found" });
        }
        const analysis = await db.getPhotoAnalysis(input.photoId);
        return { photo, analysis };
      }),
  }),
});
