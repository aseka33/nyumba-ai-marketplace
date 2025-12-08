import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  products, InsertProduct,
  // Renamed from video to photo
  photos, InsertPhoto,
  photoAnalyses, InsertPhotoAnalysis,
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

    const booleanFields = ["isVendor"] as const;
    type BooleanField = (typeof booleanFields)[number];
    const assignBoolean = (field: BooleanField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    booleanFields.forEach(assignBoolean);

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Error upserting user:", error);
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  return db.select().from(users).where(eq(users.id, id)).limit(1).then(res => res[0] ?? null);
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  return db.select().from(users).where(eq(users.openId, openId)).limit(1).then(res => res[0] ?? null);
}

export async function updateUserVendorStatus(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function getAllVendors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.isVendor, true));
}

// ============ Photo Operations (Renamed from Video) ============

export async function createPhoto(photo: InsertPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(photos).values(photo);
  return { id: Number(result.insertId) };
}

export async function getPhotoById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(photos).where(eq(photos.id, id)).limit(1).then(res => res[0] ?? null);
}

export async function updatePhotoStatus(id: number, status: InsertPhoto["status"]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(photos).set({ status, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(photos.id, id));
}

export async function createPhotoAnalysis(analysis: InsertPhotoAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(photoAnalyses).values(analysis);
  return { id: Number(result.insertId) };
}

export async function getPhotoAnalysis(photoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(photoAnalyses).where(eq(photoAnalyses.photoId, photoId)).limit(1).then(res => res[0] ?? null);
}

// ============ Product Operations ============

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  return db.select().from(products).where(eq(products.id, id)).limit(1).then(res => res[0] ?? null);
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products);
}

// ============ Order Operations ============

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(order);
  return { id: Number(result.insertId) };
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  return db.select().from(orders).where(eq(orders.id, id)).limit(1).then(res => res[0] ?? null);
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function createOrderItem(item: InsertOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orderItems).values(item);
  return { id: Number(result.insertId) };
}

// ============ Transaction Operations ============

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transactions).values(transaction);
  return { id: Number(result.insertId) };
}

export async function getTransactionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  return db.select().from(transactions).where(eq(transactions.id, id)).limit(1).then(res => res[0] ?? null);
}

// ============ Message Operations ============

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(message);
  return { id: Number(result.insertId) };
}

export async function getMessagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.userId, userId)).orderBy(desc(messages.createdAt));
}

// ============ Advertisement Operations ============

export async function createAdvertisement(ad: InsertAdvertisement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(advertisements).values(ad);
  return { id: Number(result.insertId) };
}

export async function getAdvertisementById(id: number) {
  const db = await getDb();
  if (!db) return null;
  return db.select().from(advertisements).where(eq(advertisements.id, id)).limit(1).then(res => res[0] ?? null);
}

export async function getAllAdvertisements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(advertisements);
}
