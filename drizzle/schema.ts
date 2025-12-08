import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with vendor-specific fields for marketplace functionality.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  phone: varchar("phone", { length: 20 }),
  role: mysqlEnum("role", ["user", "vendor", "admin"]).default("user").notNull(),
  
  // Vendor-specific fields
  isVendor: boolean("isVendor").default(false).notNull(),
  businessName: text("businessName"),
  businessDescription: text("businessDescription"),
  businessCategory: mysqlEnum("businessCategory", ["furniture", "art", "plants", "lighting", "textiles", "decor", "other"]),
  businessPhone: varchar("businessPhone", { length: 20 }),
  businessAddress: text("businessAddress"),
  businessCity: varchar("businessCity", { length: 100 }),
  businessWebsite: varchar("businessWebsite", { length: 500 }),
  businessVerified: boolean("businessVerified").default(false).notNull(),
  businessRating: decimal("businessRating", { precision: 3, scale: 2 }).default("0.00"),
  totalSales: int("totalSales").default(0).notNull(),
  isPremium: boolean("isPremium").default(false).notNull(),
  premiumExpiresAt: timestamp("premiumExpiresAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Product categories
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Products listed by vendors
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["furniture", "art", "plants", "lighting", "textiles", "decor", "other"]).notNull(),
  budgetTier: mysqlEnum("budgetTier", ["economy", "mid-range", "premium", "luxury"]),
  subCategory: varchar("subCategory", { length: 100 }),
  priceKES: int("priceKES").notNull(),
  currency: varchar("currency", { length: 3 }).default("KES").notNull(),
  stockQuantity: int("stockQuantity").default(0).notNull(),
  stock: int("stock").default(0).notNull(),
  views: int("views").default(0).notNull(),
  imageUrls: text("imageUrls"),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  dimensions: varchar("dimensions", { length: 255 }),
  material: varchar("material", { length: 255 }),
  color: varchar("color", { length: 100 }),
  style: varchar("style", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Photos uploaded by users for AI analysis
 */
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  photoUrl: text("photoUrl").notNull(),
  photoKey: text("photoKey").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  frameUrl: text("frameUrl"),
  fileSize: int("fileSize"),
  duration: int("duration"),
  status: mysqlEnum("status", ["processing", "completed", "failed"]).default("processing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

/**
 * AI-generated analysis and suggestions for uploaded photos
 */
export const photoAnalyses = mysqlTable("photoAnalyses", {
  id: int("id").autoincrement().primaryKey(),
  photoId: int("photoId").notNull().unique(),
  userId: int("userId").notNull(),
  
  // Room analysis
  roomType: varchar("roomType", { length: 100 }),
  userSelectedRoomType: varchar("userSelectedRoomType", { length: 100 }),
  roomSize: varchar("roomSize", { length: 50 }),
  currentStyle: varchar("currentStyle", { length: 100 }),
  lightingCondition: varchar("lightingCondition", { length: 100 }),
  colorScheme: text("colorScheme"),
  
  // Budget tier selection
  budgetTier: mysqlEnum("budgetTier", ["economy", "mid-range", "premium", "luxury"]),
  
  // AI suggestions
  suggestedStyles: text("suggestedStyles"),
  suggestedProducts: text("suggestedProducts"),
  productPlacements: text("productPlacements"),
  analysisText: text("analysisText"),
  
  // Transformed images for each budget tier
  transformedImageEconomy: text("transformedImageEconomy"),
  transformedImageMidRange: text("transformedImageMidRange"),
  transformedImagePremium: text("transformedImagePremium"),
  transformedImageLuxury: text("transformedImageLuxury"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PhotoAnalysis = typeof photoAnalyses.$inferSelect;
export type InsertPhotoAnalysis = typeof photoAnalyses.$inferInsert;

/**
 * Orders placed by users
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  vendorId: int("vendorId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  
  // Pricing
  subtotalKES: int("subtotalKES").notNull(),
  platformFeeKES: int("platformFeeKES").notNull(),
  totalKES: int("totalKES").notNull(),
  
  // Delivery
  deliveryAddress: text("deliveryAddress"),
  deliveryCity: varchar("deliveryCity", { length: 100 }),
  deliveryPhone: varchar("deliveryPhone", { length: 20 }),
  deliveryNotes: text("deliveryNotes"),
  
  // Payment
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paidAt: timestamp("paidAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Individual items within an order
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  productImageUrl: text("productImageUrl"),
  quantity: int("quantity").notNull(),
  priceKES: int("priceKES").notNull(),
  totalKES: int("totalKES").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Platform transactions and commission tracking
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  userId: int("userId").notNull(),
  vendorId: int("vendorId").notNull(),
  
  type: mysqlEnum("type", ["sale", "commission", "refund"]).notNull(),
  amountKES: int("amountKES").notNull(),
  platformFeeKES: int("platformFeeKES").notNull(),
  vendorPayoutKES: int("vendorPayoutKES").notNull(),
  
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  mpesaTransactionId: varchar("mpesaTransactionId", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Platform messaging system (anti-bypass mechanism)
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId"),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Vendor advertisements and premium positioning
 */
export const advertisements = mysqlTable("advertisements", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  productId: int("productId"),
  adType: mysqlEnum("adType", ["featured_listing", "banner", "category_spotlight"]).notNull(),
  position: int("position"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  priceKES: int("priceKES").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = typeof advertisements.$inferInsert;

/**
 * Vendor Visits - Anti-Bypass Protection
 * Tracks customer visits to vendor showrooms to ensure purchases go through platform
 */
export const vendorVisits = mysqlTable("vendorVisits", {
  id: int("id").autoincrement().primaryKey(),
  visitToken: varchar("visitToken", { length: 255 }).notNull().unique(),
  qrCodeUrl: text("qrCodeUrl"),
  customerId: int("customerId"),
  customerEmail: varchar("customerEmail", { length: 255 }),
  customerPhone: varchar("customerPhone", { length: 50 }),
  productId: int("productId").notNull(),
  vendorId: int("vendorId").notNull(),
  scheduledDate: timestamp("scheduledDate"),
  scannedAt: timestamp("scannedAt"),
  completedAt: timestamp("completedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  status: mysqlEnum("status", ["pending", "scanned", "completed", "expired", "cancelled"]).default("pending").notNull(),
  orderId: int("orderId"),
  commissionProtected: int("commissionProtected").default(1).notNull(),
  customerNotes: text("customerNotes"),
  vendorNotes: text("vendorNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VendorVisit = typeof vendorVisits.$inferSelect;
export type InsertVendorVisit = typeof vendorVisits.$inferInsert;
