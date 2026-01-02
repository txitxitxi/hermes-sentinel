import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, index, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscription plans available in the system
 */
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  durationDays: int("duration_days").notNull(), // 0 for trial, 30 for monthly, 365 for yearly
  features: text("features").notNull(), // JSON string of features
  maxRegions: int("max_regions").default(1).notNull(), // Max regions user can monitor
  maxProducts: int("max_products").default(5).notNull(), // Max products user can track
  notificationChannels: text("notification_channels").notNull(), // JSON array: ["email", "push"]
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * User subscriptions
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  planId: int("plan_id").notNull(),
  status: mysqlEnum("status", ["trial", "active", "expired", "cancelled"]).default("trial").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  autoRenew: boolean("auto_renew").default(false).notNull(),
  paymentId: varchar("payment_id", { length: 255 }), // External payment reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Supported Hermès regions/countries
 */
export const regions = mysqlTable("regions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(), // US, UK, FR, JP, etc.
  name: varchar("name", { length: 100 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(), // Base URL for the region
  currency: varchar("currency", { length: 3 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Region = typeof regions.$inferSelect;
export type InsertRegion = typeof regions.$inferInsert;

/**
 * Product categories (bag types)
 */
export const productCategories = mysqlTable("product_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

/**
 * User monitoring configurations
 */
export const monitoringConfigs = mysqlTable("monitoring_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  regionId: int("region_id").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  userRegionUnique: uniqueIndex("user_region_unique").on(table.userId, table.regionId),
}));

export type MonitoringConfig = typeof monitoringConfigs.$inferSelect;
export type InsertMonitoringConfig = typeof monitoringConfigs.$inferInsert;

/**
 * User product filter preferences
 */
export const productFilters = mysqlTable("product_filters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  categoryId: int("category_id"), // null means all categories
  colors: text("colors"), // JSON array of color preferences
  sizes: text("sizes"), // JSON array of size preferences
  minPrice: decimal("min_price", { precision: 10, scale: 2 }),
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }),
  keywords: text("keywords"), // Additional search keywords
  notifyAllRestocks: boolean("notify_all_restocks").default(false).notNull(), // If true, notify for all restocks regardless of filter criteria
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export type ProductFilter = typeof productFilters.$inferSelect;
export type InsertProductFilter = typeof productFilters.$inferInsert;

/**
 * Products detected on Hermès websites
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  regionId: int("region_id").notNull(),
  categoryId: int("category_id"),
  externalId: varchar("external_id", { length: 255 }), // Product ID from Hermès website
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }),
  color: varchar("color", { length: 100 }),
  size: varchar("size", { length: 50 }),
  imageUrl: varchar("image_url", { length: 1000 }),
  productUrl: varchar("product_url", { length: 1000 }).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  regionIdIdx: index("region_id_idx").on(table.regionId),
  categoryIdIdx: index("category_id_idx").on(table.categoryId),
  isAvailableIdx: index("is_available_idx").on(table.isAvailable),
  externalIdIdx: index("external_id_idx").on(table.externalId),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Restock history - records when products become available
 */
export const restockHistory = mysqlTable("restock_history", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id").notNull(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  wasNotified: boolean("was_notified").default(false).notNull(),
  notificationCount: int("notification_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index("product_id_idx").on(table.productId),
  detectedAtIdx: index("detected_at_idx").on(table.detectedAt),
}));

export type RestockHistory = typeof restockHistory.$inferSelect;
export type InsertRestockHistory = typeof restockHistory.$inferInsert;

/**
 * Notifications sent to users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  productId: int("product_id").notNull(),
  restockId: int("restock_id").notNull(),
  channel: mysqlEnum("channel", ["email", "push"]).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
  restockIdIdx: index("restock_id_idx").on(table.restockId),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * System monitoring logs
 */
export const monitoringLogs = mysqlTable("monitoring_logs", {
  id: int("id").autoincrement().primaryKey(),
  regionId: int("region_id").notNull(),
  status: mysqlEnum("status", ["success", "failed", "blocked"]).notNull(),
  productsFound: int("products_found").default(0).notNull(),
  newRestocks: int("new_restocks").default(0).notNull(),
  duration: int("duration").notNull(), // milliseconds
  errorMessage: text("error_message"),
  productDetails: text("product_details"), // JSON array of detected products
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  regionIdIdx: index("region_id_idx").on(table.regionId),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type MonitoringLog = typeof monitoringLogs.$inferSelect;
export type InsertMonitoringLog = typeof monitoringLogs.$inferInsert;
