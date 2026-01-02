import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getUserActiveSubscription,
  getSubscriptionPlanById,
  getAllActiveSubscriptionPlans,
  getAllActiveRegions,
  getAllActiveProductCategories,
  getUserMonitoringConfigs,
  getUserActiveMonitoringConfigs,
  getUserProductFilters,
  getUserActiveProductFilters,
  getRecentRestockHistory,
  getRestockHistoryByProduct,
  getRestockHistoryByDateRange,
  getUserNotifications,
  getRecentMonitoringLogs,
  getMonitoringLogsByRegion,
  getAllUsers,
  getUserCount,
  getActiveSubscriptionCount,
  getTotalRestockCount,
  getDb,
} from "./db";
import {
  subscriptions,
  monitoringConfigs,
  productFilters,
  type InsertSubscription,
  type InsertMonitoringConfig,
  type InsertProductFilter,
} from "../drizzle/schema";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  subscription: router({
    // Get current user's active subscription
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await getUserActiveSubscription(ctx.user.id);
      if (!subscription) return null;
      
      const plan = await getSubscriptionPlanById(subscription.planId);
      return { subscription, plan };
    }),

    // Get all available subscription plans
    getPlans: publicProcedure.query(async () => {
      return getAllActiveSubscriptionPlans();
    }),

    // Start a trial subscription
    startTrial: protectedProcedure
      .input(z.object({ planId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const plan = await getSubscriptionPlanById(input.planId);
        if (!plan) throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found' });

        // Check if user already has an active subscription
        const existing = await getUserActiveSubscription(ctx.user.id);
        if (existing) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already have an active subscription' });
        }

        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

        const newSubscription: InsertSubscription = {
          userId: ctx.user.id,
          planId: input.planId,
          status: 'trial',
          startDate,
          endDate,
          autoRenew: false,
        };

        await db.insert(subscriptions).values(newSubscription);
        return { success: true };
      }),
  }),

  monitoring: router({
    // Get supported regions
    getRegions: publicProcedure.query(async () => {
      return getAllActiveRegions();
    }),

    // Get user's monitoring configurations
    getConfigs: protectedProcedure.query(async ({ ctx }) => {
      return getUserMonitoringConfigs(ctx.user.id);
    }),

    // Add a region to monitor
    addRegion: protectedProcedure
      .input(z.object({ regionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Check subscription limits
        const subscriptionData = await getUserActiveSubscription(ctx.user.id);
        if (!subscriptionData) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Active subscription required' });
        }

        const plan = await getSubscriptionPlanById(subscriptionData.planId);
        if (!plan) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Plan not found' });

        const currentConfigs = await getUserActiveMonitoringConfigs(ctx.user.id);
        if (currentConfigs.length >= plan.maxRegions) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: `Your plan allows monitoring up to ${plan.maxRegions} regions` 
          });
        }

        const newConfig: InsertMonitoringConfig = {
          userId: ctx.user.id,
          regionId: input.regionId,
          isActive: true,
        };

        await db.insert(monitoringConfigs).values(newConfig);
        return { success: true };
      }),

    // Remove a region from monitoring
    removeRegion: protectedProcedure
      .input(z.object({ configId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        await db.delete(monitoringConfigs).where(
          and(
            eq(monitoringConfigs.id, input.configId),
            eq(monitoringConfigs.userId, ctx.user.id)
          )
        );
        return { success: true };
      }),
  }),

  filters: router({
    // Get product categories
    getCategories: publicProcedure.query(async () => {
      return getAllActiveProductCategories();
    }),

    // Get user's product filters
    getFilters: protectedProcedure.query(async ({ ctx }) => {
      return getUserProductFilters(ctx.user.id);
    }),

    // Create or update product filter
    saveFilter: protectedProcedure
      .input(z.object({
        categoryId: z.number().nullable(),
        colors: z.array(z.string()).nullable(),
        sizes: z.array(z.string()).nullable(),
        minPrice: z.number().nullable(),
        maxPrice: z.number().nullable(),
        keywords: z.string().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const newFilter: InsertProductFilter = {
          userId: ctx.user.id,
          categoryId: input.categoryId,
          colors: input.colors ? JSON.stringify(input.colors) : null,
          sizes: input.sizes ? JSON.stringify(input.sizes) : null,
          minPrice: input.minPrice?.toString(),
          maxPrice: input.maxPrice?.toString(),
          keywords: input.keywords,
          isActive: true,
        };

        await db.insert(productFilters).values(newFilter);
        return { success: true };
      }),
  }),

  restock: router({
    // Get recent restock history
    getRecent: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return getRecentRestockHistory(input.limit);
      }),

    // Get restock history by date range
    getByDateRange: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
        limit: z.number().default(100),
      }))
      .query(async ({ input }) => {
        return getRestockHistoryByDateRange(input.startDate, input.endDate, input.limit);
      }),

    // Get restock history for a specific product
    getByProduct: protectedProcedure
      .input(z.object({ productId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return getRestockHistoryByProduct(input.productId, input.limit);
      }),
  }),

  notifications: router({
    // Get user's notifications
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return getUserNotifications(ctx.user.id, input.limit);
      }),
  }),

  admin: router({
    // Get system statistics
    getStats: adminProcedure.query(async () => {
      const [userCount, activeSubscriptions, totalRestocks] = await Promise.all([
        getUserCount(),
        getActiveSubscriptionCount(),
        getTotalRestockCount(),
      ]);

      return {
        userCount,
        activeSubscriptions,
        totalRestocks,
      };
    }),

    // Get all users
    getUsers: adminProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return getAllUsers(input.limit);
      }),

    // Get monitoring logs
    getMonitoringLogs: adminProcedure
      .input(z.object({ 
        regionId: z.number().optional(),
        limit: z.number().default(100) 
      }))
      .query(async ({ input }) => {
        if (input.regionId) {
          return getMonitoringLogsByRegion(input.regionId, input.limit);
        }
        return getRecentMonitoringLogs(input.limit);
      }),

    // Monitoring service control
    getMonitoringStatus: adminProcedure.query(async () => {
      const { getMonitoringStatus } = await import('./monitoring-control');
      return getMonitoringStatus();
    }),

    startMonitoring: adminProcedure.mutation(async () => {
      const { startMonitoring } = await import('./monitoring-control');
      return startMonitoring();
    }),

    stopMonitoring: adminProcedure.mutation(async () => {
      const { stopMonitoring } = await import('./monitoring-control');
      return stopMonitoring();
    }),

    // Test notification
    sendTestNotification: adminProcedure.mutation(async () => {
      const { notifyOwner } = await import('./_core/notification');
      const success = await notifyOwner({
        title: '🧪 Test Notification from Hermès Sentinel',
        content: `This is a test notification to verify your Manus notification system is working correctly.

**Sent at**: ${new Date().toLocaleString()}

If you received this, your notification system is ready to alert you about Hermès restocks!`,
      });
      return { success, message: success ? 'Test notification sent successfully!' : 'Failed to send test notification' };
    }),
  }),
});

export type AppRouter = typeof appRouter;
