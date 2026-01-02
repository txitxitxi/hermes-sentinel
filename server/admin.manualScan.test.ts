import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';
import { getDb } from './db';
import { monitoringConfigs, regions } from '../drizzle/schema';

describe('Admin Manual Scan API', () => {
  let adminContext: TrpcContext;
  let userContext: TrpcContext;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Admin context
    adminContext = {
      user: {
        id: 1,
        openId: 'test-admin-openid',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'admin',
        loginMethod: 'manus',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: 'https', headers: {} } as TrpcContext['req'],
      res: {} as TrpcContext['res'],
    };

    // Regular user context
    userContext = {
      user: {
        id: 2,
        openId: 'test-user-openid',
        name: 'Test User',
        email: 'user@test.com',
        role: 'user',
        loginMethod: 'manus',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: 'https', headers: {} } as TrpcContext['req'],
      res: {} as TrpcContext['res'],
    };

    // Ensure we have active monitoring configs for testing
    const existingRegions = await db.select().from(regions).limit(1);
    if (existingRegions.length > 0) {
      await db.insert(monitoringConfigs).values({
        userId: adminContext.user.id,
        regionId: existingRegions[0].id,
        isActive: true,
      }).onDuplicateKeyUpdate({
        set: { isActive: true }
      });
    }
  });

  it('should have manualScan mutation available', () => {
    const caller = appRouter.createCaller(adminContext);
    expect(caller.admin.manualScan).toBeDefined();
    expect(typeof caller.admin.manualScan).toBe('function');
  });

  it('should deny access to non-admin users', async () => {
    const caller = appRouter.createCaller(userContext);
    
    await expect(caller.admin.manualScan()).rejects.toThrow();
  });

  it('should return proper response structure', async () => {
    const caller = appRouter.createCaller(adminContext);
    
    // Note: This test may take 10-15 seconds due to Puppeteer browser startup
    // In production, the scan runs asynchronously
    const result = await caller.admin.manualScan();

    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.message).toBe('string');
  }, 20000); // 20 second timeout for browser operations
});
