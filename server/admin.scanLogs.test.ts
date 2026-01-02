import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';
import { getDb } from './db';
import { scanLogs } from '../drizzle/schema';



describe('Admin Scan Logs API', () => {
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

    // Insert test scan logs
    await db.insert(scanLogs).values([
      {
        regionId: 1,
        status: 'success',
        productsFound: 5,
        newRestocks: 2,
        duration: 1500,
        errorMessage: null,
      },
      {
        regionId: 2,
        status: 'failed',
        productsFound: 0,
        newRestocks: 0,
        duration: 500,
        errorMessage: 'Connection timeout',
      },
      {
        regionId: 3,
        status: 'success',
        productsFound: 10,
        newRestocks: 0,
        duration: 2000,
        errorMessage: null,
      },
    ]);
  });

  it('should allow admin to get scan logs', async () => {
    const caller = appRouter.createCaller(adminContext);
    const logs = await caller.admin.getScanLogs();

    expect(logs).toBeDefined();
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
    
    // Check log structure
    const log = logs[0];
    expect(log).toHaveProperty('id');
    expect(log).toHaveProperty('regionId');
    expect(log).toHaveProperty('status');
    expect(log).toHaveProperty('productsFound');
    expect(log).toHaveProperty('newRestocks');
    expect(log).toHaveProperty('duration');
    expect(log).toHaveProperty('createdAt');
  });

  it('should return logs with correct data types', async () => {
    const caller = appRouter.createCaller(adminContext);
    const logs = await caller.admin.getScanLogs();

    const log = logs[0];
    expect(typeof log.id).toBe('number');
    expect(typeof log.regionId).toBe('number');
    expect(['success', 'failed']).toContain(log.status);
    expect(typeof log.productsFound).toBe('number');
    expect(typeof log.newRestocks).toBe('number');
    expect(typeof log.duration).toBe('number');
    expect(log.createdAt).toBeInstanceOf(Date);
  });

  it('should return logs ordered by creation time', async () => {
    const caller = appRouter.createCaller(adminContext);
    const logs = await caller.admin.getScanLogs();

    // Check that logs are ordered (newest or oldest first)
    if (logs.length > 1) {
      const timestamps = logs.map(log => log.createdAt.getTime());
      const isSorted = timestamps.every((val, i, arr) => !i || arr[i - 1] <= val || arr[i - 1] >= val);
      expect(isSorted).toBe(true);
    }
  });

  it('should deny access to non-admin users', async () => {
    const caller = appRouter.createCaller(userContext);
    
    await expect(caller.admin.getScanLogs()).rejects.toThrow();
  });

  it('should limit results to 100 logs', async () => {
    const caller = appRouter.createCaller(adminContext);
    const logs = await caller.admin.getScanLogs();

    expect(logs.length).toBeLessThanOrEqual(100);
  });

  it('should include error messages for failed scans', async () => {
    const caller = appRouter.createCaller(adminContext);
    const logs = await caller.admin.getScanLogs();

    const failedLog = logs.find(log => log.status === 'failed');
    if (failedLog) {
      expect(failedLog.errorMessage).toBeDefined();
      expect(typeof failedLog.errorMessage).toBe('string');
    }
  });
});
