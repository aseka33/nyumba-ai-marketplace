import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  products, InsertProduct,
  videos, InsertVideo,
  videoAnalyses, InsertVideoAnalysis,
  orders, InsertOrder,
  orderItems, InsertOrderItem,
  transactions, InsertTransaction,
  messages, InsertMessage,
  advertisements, InsertAdvertisement
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Operations ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "businessName", "businessDescription", "businessPhone", "businessAddress", "businessCity"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.isVendor !== undefined) {
      values.isVendor = user.isVendor;
      updateSet.isVendor = user.isVendor;
    }
    if (user.businessCategory !== undefined) {
      values.businessCategory = user.businessCategory;
      updateSet.businessCategory = user.businessCategory;
    }
    if (user.isPremium !== undefined) {
      values.isPremium = user.isPremium;
      updateSet.isPremium = user.isPremium;
    }
    if (user.premiumExpiresAt !== undefined) {
      values.premiumExpiresAt = user.premiumExpiresAt;
      updateSet.premiumExpiresAt = user.premiumExpiresAt;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserVendorStatus(userId: number, vendorData: {
  isVendor: boolean;
  businessName?: string;
  businessDescription?: string;
  businessCategory?: "furniture" | "art" | "plants" | "lighting" | "textiles" | "decor" | "other";
  businessPhone?: string;
  businessAddress?: string;
  businessCity?: string;
}) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({
    ...vendorData,
    role: vendorData.isVendor ? 'vendor' : 'user',
    updatedAt: new Date()
  }).where(eq(users.id, userId));
}

export async function getAllVendors() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).where(eq(users.isVendor, true)).orderBy(desc(users.isPremium), desc(users.createdAt));
}

// ============ Product Operations ============

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(products).values(product);
  return result;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductsByVendor(vendorId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(products).where(eq(products.vendorId, vendorId)).orderBy(desc(products.createdAt));
}

export async function getAllProducts(filters?: { category?: string; isActive?: boolean; isFeatured?: boolean }) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(products);
  
  const conditions = [];
  if (filters?.category) conditions.push(eq(products.category, filters.category as any));
  if (filters?.isActive !== undefined) conditions.push(eq(products.isActive, filters.isActive));
  if (filters?.isFeatured !== undefined) conditions.push(eq(products.isFeatured, filters.isFeatured));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return query.orderBy(desc(products.isFeatured), desc(products.createdAt));
}

export async function updateProduct(id: number, updates: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) return;

  await db.update(products).set({ ...updates, updatedAt: new Date() }).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(products).where(eq(products.id, id));
}

// ============ Video Operations ============

export async function createVideo(video: InsertVideo) {
  const db = await getDb();
  if (!db) {
    console.error('[DB] Cannot create video: database not available');
    return null;
  }

  try {
    const result = await db.insert(videos).values(video);
    console.log('[DB] Video created successfully:', result);
    return result;
  } catch (error) {
    console.error('[DB] Error creating video:', error);
    throw error;
  }
}

export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVideosByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.createdAt));
}

export async function updateVideoStatus(videoId: number, status: "processing" | "completed" | "failed", frameUrl?: string) {
  const db = await getDb();
  if (!db) return;

  const updateData: any = { status, updatedAt: new Date() };
  if (frameUrl) {
    updateData.frameUrl = frameUrl;
  }

  await db.update(videos).set(updateData).where(eq(videos.id, videoId));
}

// ============ Video Analysis Operations ============

export async function createVideoAnalysis(analysis: InsertVideoAnalysis) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(videoAnalyses).values(analysis);
  return result;
}

export async function getVideoAnalysisByVideoId(videoId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(videoAnalyses).where(eq(videoAnalyses.videoId, videoId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Order Operations ============

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(orders).values(order);
  return result;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrdersByVendor(vendorId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orders).where(eq(orders.vendorId, vendorId)).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(id: number, status: string, paymentStatus?: string) {
  const db = await getDb();
  if (!db) return;

  const updates: any = { status, updatedAt: new Date() };
  if (paymentStatus) updates.paymentStatus = paymentStatus;
  if (paymentStatus === 'paid') updates.paidAt = new Date();

  await db.update(orders).set(updates).where(eq(orders.id, id));
}

// ============ Order Item Operations ============

export async function createOrderItem(item: InsertOrderItem) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(orderItems).values(item);
  return result;
}

export async function getOrderItemsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

// ============ Transaction Operations ============

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(transactions).values(transaction);
  return result;
}

export async function getTransactionsByVendor(vendorId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(transactions).where(eq(transactions.vendorId, vendorId)).orderBy(desc(transactions.createdAt));
}

export async function getPlatformTransactions() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(transactions).orderBy(desc(transactions.createdAt));
}

// ============ Message Operations ============

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(messages).values(message);
  return result;
}

export async function getMessagesBetweenUsers(user1Id: number, user2Id: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(messages).where(
    sql`(${messages.senderId} = ${user1Id} AND ${messages.receiverId} = ${user2Id}) OR (${messages.senderId} = ${user2Id} AND ${messages.receiverId} = ${user1Id})`
  ).orderBy(messages.createdAt);
}

export async function markMessageAsRead(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
}

// ============ Advertisement Operations ============

export async function createAdvertisement(ad: InsertAdvertisement) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(advertisements).values(ad);
  return result;
}

export async function getActiveAdvertisements(adType?: string) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const conditions = [
    eq(advertisements.isActive, true),
    sql`${advertisements.startDate} <= ${now}`,
    sql`${advertisements.endDate} >= ${now}`
  ];

  if (adType) {
    conditions.push(eq(advertisements.adType, adType as any));
  }

  return db.select().from(advertisements).where(and(...conditions)).orderBy(advertisements.position);
}
