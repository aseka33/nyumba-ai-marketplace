/**
 * Vendor Visits Schema - Anti-Bypass Protection
 * 
 * Tracks customer visits to vendor showrooms to ensure
 * purchases go through the platform
 */

import { mysqlTable, int, varchar, timestamp, text, mysqlEnum } from 'drizzle-orm/mysql-core';

export const vendorVisits = mysqlTable('vendorVisits', {
  id: int('id').primaryKey().autoincrement(),
  
  // Visit identification
  visitToken: varchar('visit_token', { length: 255 }).notNull().unique(),
  qrCodeUrl: text('qr_code_url'),
  
  // Relationships
  customerId: int('customer_id'), // Can be null for demo/guest users
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  productId: int('product_id').notNull(),
  vendorId: int('vendor_id').notNull(),
  
  // Visit details
  scheduledDate: timestamp('scheduled_date'),
  scannedAt: timestamp('scanned_at'),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at').notNull(),
  
  // Status tracking
  status: mysqlEnum('status', ['pending', 'scanned', 'completed', 'expired', 'cancelled']).default('pending'),
  
  // Commission protection
  orderId: int('order_id'), // Set when purchase is completed
  commissionProtected: int('commission_protected').default(1), // Boolean: 1 = must go through platform
  
  // Notes
  customerNotes: text('customer_notes'),
  vendorNotes: text('vendor_notes'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type VendorVisit = typeof vendorVisits.$inferSelect;
export type InsertVendorVisit = typeof vendorVisits.$inferInsert;
