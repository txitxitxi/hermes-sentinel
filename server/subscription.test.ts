import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1, role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("subscription.getPlans", () => {
  it("returns available subscription plans", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.subscription.getPlans();

    expect(plans).toBeDefined();
    expect(Array.isArray(plans)).toBe(true);
    
    // Should have at least the seeded plans
    expect(plans.length).toBeGreaterThan(0);
    
    // Check plan structure
    if (plans.length > 0) {
      const plan = plans[0];
      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('name');
      expect(plan).toHaveProperty('price');
      expect(plan).toHaveProperty('currency');
      expect(plan).toHaveProperty('durationDays');
      expect(plan).toHaveProperty('maxRegions');
      expect(plan).toHaveProperty('maxProducts');
    }
  });
});

describe("subscription.getCurrent", () => {
  it("returns null when user has no active subscription", async () => {
    const ctx = createAuthContext(999); // User without subscription
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.getCurrent();

    expect(result).toBeNull();
  });
});

describe("monitoring.getRegions", () => {
  it("returns list of available regions", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const regions = await caller.monitoring.getRegions();

    expect(regions).toBeDefined();
    expect(Array.isArray(regions)).toBe(true);
    
    // Should have seeded regions
    expect(regions.length).toBeGreaterThan(0);
    
    // Check region structure
    if (regions.length > 0) {
      const region = regions[0];
      expect(region).toHaveProperty('id');
      expect(region).toHaveProperty('code');
      expect(region).toHaveProperty('name');
      expect(region).toHaveProperty('url');
      expect(region).toHaveProperty('currency');
      expect(region).toHaveProperty('isActive');
    }
  });
});

describe("filters.getCategories", () => {
  it("returns list of product categories", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.filters.getCategories();

    expect(categories).toBeDefined();
    expect(Array.isArray(categories)).toBe(true);
    
    // Should have seeded categories
    expect(categories.length).toBeGreaterThan(0);
    
    // Check category structure
    if (categories.length > 0) {
      const category = categories[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('isActive');
    }
  });
});

describe("admin.getStats", () => {
  it("returns system statistics for admin users", async () => {
    const ctx = createAuthContext(1, "admin");
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.admin.getStats();

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty('userCount');
    expect(stats).toHaveProperty('activeSubscriptions');
    expect(stats).toHaveProperty('totalRestocks');
    
    expect(typeof stats.userCount).toBe('number');
    expect(typeof stats.activeSubscriptions).toBe('number');
    expect(typeof stats.totalRestocks).toBe('number');
  });

  it("throws FORBIDDEN error for non-admin users", async () => {
    const ctx = createAuthContext(1, "user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.getStats()).rejects.toThrow();
  });
});
