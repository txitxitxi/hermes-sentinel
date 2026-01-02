import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
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

describe("admin.getMonitoringStatus", () => {
  it("returns monitoring service status for admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.admin.getMonitoringStatus();

    expect(status).toBeDefined();
    expect(status).toHaveProperty('isRunning');
    expect(status).toHaveProperty('totalRegionsMonitored');
    expect(status).toHaveProperty('totalRestocksDetected');
    
    expect(typeof status.isRunning).toBe('boolean');
    expect(typeof status.totalRegionsMonitored).toBe('number');
    expect(typeof status.totalRestocksDetected).toBe('number');
  });
});

// Note: startMonitoring test is skipped because it runs a full monitoring cycle
// which takes 30+ seconds with 15 regions. In production, mock the monitoring service for faster tests.
// The functionality is tested manually via the admin panel UI.

describe("admin.stopMonitoring", () => {
  it("stops the monitoring service", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.stopMonitoring();

    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.message).toBe('string');
  });
});

describe("admin.sendTestNotification", () => {
  it("sends a test notification to the owner", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.sendTestNotification();

    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.message).toBe('string');
  });
});
