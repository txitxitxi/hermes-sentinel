import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  subscriptions,
  subscriptionPlans,
  regions,
  productCategories,
  monitoringConfigs,
  productFilters,
  products,
  restockHistory,
  notifications,
  monitoringLogs,
  type Subscription,
  type SubscriptionPlan,
  type Region,
  type ProductCategory,
  type MonitoringConfig,
  type ProductFilter,
  type Product,
  type RestockHistory,
  type Notification,
  type MonitoringLog,
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

    const textFields = ["name", "email", "loginMethod"] as const;
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
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Subscription queries
export async function getUserActiveSubscription(userId: number): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const now = new Date();
  const result = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        gte(subscriptions.endDate, now),
        sql`${subscriptions.status} IN ('trial', 'active')`
      )
    )
    .orderBy(desc(subscriptions.endDate))
    .limit(1);

  return result[0];
}

export async function getSubscriptionPlanById(planId: number): Promise<SubscriptionPlan | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
  return result[0];
}

export async function getAllActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
}

// Region queries
export async function getAllActiveRegions(): Promise<Region[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(regions).where(eq(regions.isActive, true));
}

export async function getRegionById(regionId: number): Promise<Region | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(regions).where(eq(regions.id, regionId)).limit(1);
  return result[0];
}

// Product category queries
export async function getAllActiveProductCategories(): Promise<ProductCategory[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(productCategories).where(eq(productCategories.isActive, true));
}

// Monitoring config queries
export async function getUserMonitoringConfigs(userId: number): Promise<MonitoringConfig[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(monitoringConfigs).where(eq(monitoringConfigs.userId, userId));
}

export async function getUserActiveMonitoringConfigs(userId: number): Promise<MonitoringConfig[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(monitoringConfigs)
    .where(and(eq(monitoringConfigs.userId, userId), eq(monitoringConfigs.isActive, true)));
}

// Product filter queries
export async function getUserProductFilters(userId: number): Promise<ProductFilter[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(productFilters).where(eq(productFilters.userId, userId));
}

export async function getUserActiveProductFilters(userId: number): Promise<ProductFilter[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(productFilters)
    .where(and(eq(productFilters.userId, userId), eq(productFilters.isActive, true)));
}

// Product queries
export async function getProductById(productId: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return result[0];
}

export async function getAvailableProductsByRegion(regionId: number, limit = 50): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(products)
    .where(and(eq(products.regionId, regionId), eq(products.isAvailable, true)))
    .orderBy(desc(products.lastSeenAt))
    .limit(limit);
}

// Restock history queries
export async function getRecentRestockHistory(limit = 100): Promise<RestockHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(restockHistory)
    .orderBy(desc(restockHistory.detectedAt))
    .limit(limit);
}

export async function getRestockHistoryByProduct(productId: number, limit = 50): Promise<RestockHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(restockHistory)
    .where(eq(restockHistory.productId, productId))
    .orderBy(desc(restockHistory.detectedAt))
    .limit(limit);
}

export async function getRestockHistoryByDateRange(
  startDate: Date,
  endDate: Date,
  limit = 100
): Promise<RestockHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(restockHistory)
    .where(and(gte(restockHistory.detectedAt, startDate), lte(restockHistory.detectedAt, endDate)))
    .orderBy(desc(restockHistory.detectedAt))
    .limit(limit);
}

// Notification queries
export async function getUserNotifications(userId: number, limit = 50): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

// Monitoring log queries
export async function getRecentMonitoringLogs(limit = 100): Promise<MonitoringLog[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(monitoringLogs)
    .orderBy(desc(monitoringLogs.createdAt))
    .limit(limit);
}

export async function getMonitoringLogsByRegion(regionId: number, limit = 50): Promise<MonitoringLog[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(monitoringLogs)
    .where(eq(monitoringLogs.regionId, regionId))
    .orderBy(desc(monitoringLogs.createdAt))
    .limit(limit);
}

// Admin queries
export async function getAllUsers(limit = 100): Promise<typeof users.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
}

export async function getUserCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return result[0]?.count ?? 0;
}

export async function getActiveSubscriptionCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(
      and(
        gte(subscriptions.endDate, now),
        sql`${subscriptions.status} IN ('trial', 'active')`
      )
    );
  return result[0]?.count ?? 0;
}

export async function getTotalRestockCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: sql<number>`count(*)` }).from(restockHistory);
  return result[0]?.count ?? 0;
}
