import { z } from 'zod';
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { initiateMpesaPayment } from "./mpesa";

export const orderRouter = router({
  createOrder: protectedProcedure
    .input(z.object({
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().min(1),
        priceKES: z.number(),
      })),
      deliveryAddress: z.string(),
      deliveryCity: z.string(),
      deliveryPhone: z.string(),
      deliveryNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orderNumber = `ORD-${Date.now()}`;
      const subtotal = input.items.reduce((sum, item) => sum + item.priceKES * item.quantity, 0);
      const platformFee = Math.round(subtotal * 0.05);
      const deliveryFee = 500;
      const total = subtotal + platformFee + deliveryFee;

      // Create order
      const orderResult = await db.createOrder({
        userId: ctx.user.id,
        vendorId: 1,
        orderNumber,
        status: "pending",
        subtotalKES: subtotal,
        platformFeeKES: platformFee,
        totalKES: total,
        deliveryAddress: input.deliveryAddress,
        deliveryCity: input.deliveryCity,
        deliveryPhone: input.deliveryPhone,
        deliveryNotes: input.deliveryNotes,
        paymentStatus: "pending",
      });

      const orderId = Number((orderResult as any).insertId);

      // Create order items
      for (const item of input.items) {
        const product = await db.getProductById(item.productId);
        if (product) {
          await db.createOrderItem({
            orderId,
            productId: item.productId,
            productName: product.name,
            productImageUrl: product.imageUrls ? JSON.parse(product.imageUrls)[0] : null,
            quantity: item.quantity,
            priceKES: item.priceKES,
            totalKES: item.priceKES * item.quantity,
          });
        }
      }

      return { orderId, orderNumber, total };
    }),

  getOrder: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getOrderById(input.orderId);
    }),

  getMyOrders: protectedProcedure.query(async ({ ctx }) => {
    return db.getOrdersByUser(ctx.user.id);
  }),
});

export const paymentRouter = router({
  initiateMpesaPayment: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      amount: z.number(),
      phoneNumber: z.string(),
      accountReference: z.string(),
      transactionDescription: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Call M-Pesa API to initiate STK Push
        const mpesaResponse = await initiateMpesaPayment({
          phoneNumber: input.phoneNumber,
          amount: input.amount,
          accountReference: input.accountReference,
          transactionDesc: input.transactionDescription,
          callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://example.com/callback',
        });

        // Create transaction record
        await db.createTransaction({
          orderId: input.orderId,
          userId: ctx.user.id,
          vendorId: 1,
          type: "sale",
          amountKES: input.amount,
          platformFeeKES: Math.round(input.amount * 0.05),
          vendorPayoutKES: input.amount - Math.round(input.amount * 0.05),
          status: "pending",
            mpesaTransactionId: mpesaResponse.checkoutRequestId || '',
        });

        return { success: true, checkoutRequestId: mpesaResponse.checkoutRequestId || '' };
      } catch (error) {
        console.error('[Payment] M-Pesa error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to initiate M-Pesa payment',
        });
      }
    }),

  checkPaymentStatus: protectedProcedure
    .input(z.object({ checkoutRequestId: z.string() }))
    .query(async ({ input }) => {
      // Query M-Pesa API for payment status
      return { status: "pending" };
    }),
});
