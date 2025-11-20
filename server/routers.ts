import { z } from 'zod';
import type { InsertVideoAnalysis } from '../drizzle/schema';
type BudgetTier = InsertVideoAnalysis['budgetTier'];
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import * as db from "./db";
import { analyzeRoomVideo } from "./videoAnalysis";
import { orderRouter, paymentRouter } from "./orderRouters";
import { uploadRouter } from "./uploadRouter";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// Vendor-only procedure
const vendorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'vendor' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Vendor access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  upload: uploadRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // User & Vendor Management
  user: router({
    becomeVendor: protectedProcedure
      .input(z.object({
        businessName: z.string(),
        businessDescription: z.string(),
        businessCategory: z.enum(["furniture", "art", "plants", "lighting", "textiles", "decor", "other"]),
        businessPhone: z.string(),
        businessAddress: z.string(),
        businessCity: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserVendorStatus(ctx.user.id, {
          isVendor: true,
          ...input
        });
        return { success: true };
      }),

    getVendorProfile: publicProcedure
      .input(z.object({ vendorId: z.number() }))
      .query(async ({ input }) => {
        const vendor = await db.getUserById(input.vendorId);
        if (!vendor || !vendor.isVendor) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Vendor not found' });
        }
        return vendor;
      }),

    getAllVendors: publicProcedure.query(async () => {
      return db.getAllVendors();
    }),
  }),

  // Video Upload & Analysis
  video: router({
    uploadVideo: protectedProcedure
      .input(z.object({
        videoData: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        budgetTier: z.enum(["economy", "mid-range", "premium", "luxury"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let videoId = 0;
        let videoUrl = '';

        try {
          // Validate file size (max 16MB)
          if (input.fileSize > 16 * 1024 * 1024) {
            throw new TRPCError({ 
              code: 'BAD_REQUEST', 
              message: 'Video file size must be less than 16MB' 
            });
          }

          // Convert base64 to buffer
          const buffer = Buffer.from(input.videoData.split(',')[1], 'base64');
          console.log('[Video Upload] Buffer created, size:', buffer.length);
          
          // Upload to S3
          const videoKey = `videos/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          console.log('[Video Upload] Uploading to S3:', videoKey);
          const uploadResult = await storagePut(videoKey, buffer, input.mimeType);
          videoUrl = uploadResult.url;
          console.log('[Video Upload] S3 upload successful:', videoUrl);

          // Create video record
          console.log('[Video Upload] Creating video record...');
          const result = await db.createVideo({
            userId: ctx.user.id,
            videoUrl,
            videoKey,
            fileSize: input.fileSize,
            status: "processing"
          });
          console.log('[Video Upload] Video record created:', JSON.stringify(result, null, 2));

          // Drizzle ORM returns result in format: [ResultSetHeader, undefined]
          // ResultSetHeader has insertId property
          if (Array.isArray(result) && result[0]) {
            videoId = Number(result[0].insertId);
          } else if ((result as any).insertId) {
            videoId = Number((result as any).insertId);
          } else {
            videoId = 0;
          }
          console.log('[Video Upload] Extracted videoId:', videoId, 'from result type:', typeof result);

          // Validate videoId before starting analysis
          if (!videoId || isNaN(videoId) || videoId <= 0) {
            console.error('[Video Upload] Invalid videoId after creation:', { result, videoId });
            throw new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: 'Failed to create video record' 
            });
          }

          // Start analysis asynchronously
          analyzeRoomVideo(videoId, ctx.user.id, videoUrl, input.budgetTier).catch(err => {
            console.error('[Video] Analysis failed:', err);
          });

          return { videoId, videoUrl };
        } catch (error) {
          console.error('[Video Upload] Error in mutation:', error);
          throw error;
        }
      }),

    getMyVideos: protectedProcedure.query(async ({ ctx }) => {
      return db.getVideosByUser(ctx.user.id);
    }),

    getVideoAnalysis: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ ctx, input }) => {
        const video = await db.getVideoById(input.videoId);
        if (!video || video.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Video not found' });
        }

        const analysis = await db.getVideoAnalysisByVideoId(input.videoId);
        return { video, analysis };
      }),
  }),

  // Product Management
  product: router({
    create: vendorProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        category: z.enum(["furniture", "art", "plants", "lighting", "textiles", "decor", "other"]),
        subCategory: z.string().optional(),
        priceKES: z.number(),
        stockQuantity: z.number(),
        imageUrls: z.array(z.string()),
        dimensions: z.string().optional(),
        material: z.string().optional(),
        color: z.string().optional(),
        style: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createProduct({
          vendorId: ctx.user.id,
          ...input,
          imageUrls: JSON.stringify(input.imageUrls),
          currency: "KES"
        });
        return { productId: result ? Number((result as any).insertId) : 0 };
      }),

    update: vendorProcedure
      .input(z.object({
        productId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.enum(["furniture", "art", "plants", "lighting", "textiles", "decor", "other"]).optional(),
        subCategory: z.string().optional(),
        priceKES: z.number().optional(),
        stockQuantity: z.number().optional(),
        imageUrls: z.array(z.string()).optional(),
        dimensions: z.string().optional(),
        material: z.string().optional(),
        color: z.string().optional(),
        style: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product || product.vendorId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        const { productId, ...updates } = input;
        const updateData: any = updates;
        if (updates.imageUrls) {
          updateData.imageUrls = JSON.stringify(updates.imageUrls);
        }

        await db.updateProduct(productId, updateData);
        return { success: true };
      }),

    delete: vendorProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product || product.vendorId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
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
        const product = await db.getProductById(input.productId);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        }
        return product;
      }),

    getAll: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        vendorId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        if (input.vendorId) {
          return db.getProductsByVendor(input.vendorId);
        }
        return db.getAllProducts({ 
          isActive: true,
          category: input.category as any
        });
      }),

    getFeatured: publicProcedure.query(async () => {
      return db.getAllProducts({ isActive: true, isFeatured: true });
    }),
  }),

  // Order & Checkout
  order: router({
    create: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
        })),
        deliveryAddress: z.string(),
        deliveryCity: z.string(),
        deliveryPhone: z.string(),
        deliveryNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate products and calculate totals
        let subtotalKES = 0;
        const orderItemsData = [];

        for (const item of input.items) {
          const product = await db.getProductById(item.productId);
          if (!product || !product.isActive) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `Product ${item.productId} not available` });
          }
          if (product.stockQuantity < item.quantity) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `Insufficient stock for ${product.name}` });
          }

          const itemTotal = product.priceKES * item.quantity;
          subtotalKES += itemTotal;

          orderItemsData.push({
            productId: product.id,
            productName: product.name,
            productImageUrl: product.imageUrls ? JSON.parse(product.imageUrls)[0] : null,
            quantity: item.quantity,
            priceKES: product.priceKES,
            totalKES: itemTotal,
            vendorId: product.vendorId
          });
        }

        // Calculate platform fee (10% commission)
        const platformFeeKES = Math.floor(subtotalKES * 0.10);
        const totalKES = subtotalKES;

        // Group items by vendor (for now, assume single vendor per order)
        const vendorId = orderItemsData[0].vendorId;

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${ctx.user.id}`;

        // Create order
        const orderResult = await db.createOrder({
          userId: ctx.user.id,
          vendorId,
          orderNumber,
          subtotalKES,
          platformFeeKES,
          totalKES,
          deliveryAddress: input.deliveryAddress,
          deliveryCity: input.deliveryCity,
          deliveryPhone: input.deliveryPhone,
          deliveryNotes: input.deliveryNotes,
          status: "pending",
          paymentStatus: "pending"
        });

        const orderId = orderResult ? Number((orderResult as any).insertId) : 0;

        // Create order items
        for (const itemData of orderItemsData) {
          await db.createOrderItem({
            orderId,
            ...itemData
          });

          // Update product stock
          const product = await db.getProductById(itemData.productId);
          if (product) {
            await db.updateProduct(itemData.productId, {
              stockQuantity: product.stockQuantity - itemData.quantity
            });
          }
        }

        return { orderId, orderNumber };
      }),

    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrdersByUser(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order || order.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }

        const items = await db.getOrderItemsByOrderId(input.orderId);
        return { order, items };
      }),

    // Vendor order management
    getVendorOrders: vendorProcedure.query(async ({ ctx }) => {
      return db.getOrdersByVendor(ctx.user.id);
    }),

    updateStatus: vendorProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order || order.vendorId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        await db.updateOrderStatus(input.orderId, input.status);
        return { success: true };
      }),
  }),

  // Messaging (Anti-bypass mechanism)
  message: router({
    send: protectedProcedure
      .input(z.object({
        receiverId: z.number(),
        content: z.string(),
        orderId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createMessage({
          senderId: ctx.user.id,
          receiverId: input.receiverId,
          content: input.content,
          orderId: input.orderId,
        });
        return { success: true };
      }),

    getConversation: protectedProcedure
      .input(z.object({ otherUserId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getMessagesBetweenUsers(ctx.user.id, input.otherUserId);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markMessageAsRead(input.messageId);
        return { success: true };
      }),
  }),

  // Premium Features & Advertisements
  premium: router({
    createAd: vendorProcedure
      .input(z.object({
        productId: z.number().optional(),
        adType: z.enum(["featured_listing", "banner", "category_spotlight"]),
        startDate: z.date(),
        endDate: z.date(),
        priceKES: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createAdvertisement({
          vendorId: ctx.user.id,
          ...input,
        });
        return { adId: result ? Number((result as any).insertId) : 0 };
      }),

    getActiveAds: publicProcedure
      .input(z.object({ adType: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getActiveAdvertisements(input.adType);
      }),
  }),

  // Admin operations
  admin: router({
    getAllOrders: adminProcedure.query(async () => {
      // This would need a new db function
      return [];
    }),

    getTransactions: adminProcedure.query(async () => {
      return db.getPlatformTransactions();
    }),

    toggleProductFeatured: adminProcedure
      .input(z.object({ productId: z.number(), isFeatured: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.updateProduct(input.productId, { isFeatured: input.isFeatured });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
