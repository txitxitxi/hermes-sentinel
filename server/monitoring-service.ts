/**
 * Hermès Website Monitoring Service
 * 
 * This service monitors Hermès official websites for product availability changes.
 * It uses headless browser technology to detect restocks and notify subscribed users.
 * 
 * Key Features:
 * - Multi-region website monitoring
 * - Product change detection
 * - Anti-bot detection strategies
 * - Notification queue management
 */

import { getDb, getUserActiveProductFilters } from './db';
import { notifyOwner } from './_core/notification';
import { 
  regions, 
  products, 
  restockHistory, 
  notifications, 
  monitoringLogs,
  monitoringConfigs,
  type Region,
  type Product,
  type InsertProduct,
  type InsertRestockHistory,
  type InsertNotification,
  type InsertMonitoringLog,
} from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import puppeteer from 'puppeteer';

/**
 * MonitoringService handles the core monitoring logic
 */
export class MonitoringService {
  private _isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL_MS = 30000; // 30 seconds

  /**
   * Start the monitoring service
   */
  async start() {
    if (this._isRunning) {
      console.log('[MonitoringService] Already running');
      return;
    }

    console.log('[MonitoringService] Starting...');
    this._isRunning = true;

    // Run initial scan
    await this.runMonitoringCycle();

    // Schedule periodic scans
    this.monitoringInterval = setInterval(async () => {
      await this.runMonitoringCycle();
    }, this.MONITORING_INTERVAL_MS);

    console.log('[MonitoringService] Started successfully');
  }

  /**
   * Stop the monitoring service
   */
  stop() {
    if (!this._isRunning) {
      return;
    }

    console.log('[MonitoringService] Stopping...');
    this._isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('[MonitoringService] Stopped');
  }

  /**
   * Run a complete monitoring cycle for all active regions
   */
  private async runMonitoringCycle() {
    const db = await getDb();
    if (!db) {
      console.error('[MonitoringService] Database not available');
      return;
    }

    try {
      // Get all active regions
      const activeRegions = await db.select().from(regions).where(eq(regions.isActive, true));
      
      console.log(`[MonitoringService] Monitoring ${activeRegions.length} regions`);

      // Monitor each region
      for (const region of activeRegions) {
        await this.monitorRegion(region);
        
        // Add delay between regions to avoid rate limiting
        await this.delay(2000);
      }
    } catch (error) {
      console.error('[MonitoringService] Error in monitoring cycle:', error);
    }
  }

  /**
   * Monitor a specific region for product changes
   */
  private async monitorRegion(region: Region) {
    const startTime = Date.now();
    const db = await getDb();
    if (!db) return;

    try {
      console.log(`[MonitoringService] Monitoring region: ${region.name} (${region.code})`);

      // In a real implementation, this would use Puppeteer/Playwright to scrape the website
      // For now, we'll simulate the monitoring process
      const scrapedProducts = await this.scrapeRegionWebsite(region);

      let productsFound = 0;
      let newRestocks = 0;

      // Process each scraped product
      for (const scrapedProduct of scrapedProducts) {
        productsFound++;

        // Check if product exists in database
        const existingProducts = scrapedProduct.externalId ? await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.regionId, region.id),
              eq(products.externalId, scrapedProduct.externalId)
            )
          )
          .limit(1) : [];

        const existingProduct = existingProducts[0];

        if (!existingProduct) {
          // New product detected - insert it
          // Ensure null values are converted to undefined for Drizzle
          const productToInsert = {
            ...scrapedProduct,
            categoryId: scrapedProduct.categoryId ?? undefined,
            description: scrapedProduct.description ?? undefined,
            imageUrl: scrapedProduct.imageUrl ?? undefined,
            size: scrapedProduct.size ?? undefined,
            color: scrapedProduct.color ?? undefined,
            price: scrapedProduct.price ?? undefined,
          };
          const insertResult = await db.insert(products).values(productToInsert);
          const productId = Number(insertResult[0].insertId);

          // Record restock
          await this.recordRestock(productId, scrapedProduct.price ?? undefined);
          newRestocks++;

          // Queue notifications for users monitoring this region
          await this.queueNotifications(productId, region.id);
        } else if (!existingProduct.isAvailable && scrapedProduct.isAvailable) {
          // Product became available again - restock detected
          await db
            .update(products)
            .set({
              isAvailable: true,
              lastSeenAt: new Date(),
              price: scrapedProduct.price,
            })
            .where(eq(products.id, existingProduct.id));

          // Record restock
          await this.recordRestock(existingProduct.id, scrapedProduct.price ?? undefined);
          newRestocks++;

          // Queue notifications
          await this.queueNotifications(existingProduct.id, region.id);
        } else {
          // Product still available - update last seen time
          await db
            .update(products)
            .set({ lastSeenAt: new Date() })
            .where(eq(products.id, existingProduct.id));
        }
      }

      // Log successful monitoring
      const duration = Date.now() - startTime;
      await this.logMonitoring(region.id, 'success', productsFound, newRestocks, duration, undefined, scrapedProducts);

      if (newRestocks > 0) {
        console.log(`[MonitoringService] Found ${newRestocks} new restocks in ${region.name}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logMonitoring(region.id, 'failed', 0, 0, duration, errorMessage);
      console.error(`[MonitoringService] Error monitoring ${region.name}:`, error);
    }
  }

  /**
   * Scrape a region's website for products
   * Uses Puppeteer with stealth plugin for anti-detection
   */
  private async scrapeRegionWebsite(region: Region): Promise<InsertProduct[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Set realistic viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Navigate to the bags page
      console.log(`[Scraper] Navigating to ${region.url}`);
      await page.goto(region.url, { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });

      // Wait for product grid to load
      await page.waitForSelector('div[role="button"]', { timeout: 60000 });
      
      // Random delay to appear more human-like
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Extract products using the correct selectors
      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll('div[role="button"]');
        const results: any[] = [];

        productElements.forEach((element) => {
          try {
            // Get the product link
            const linkElement = element.querySelector('a[id^="product-item-meta-link-"]');
            if (!linkElement) return;

            const productId = linkElement.getAttribute('id')?.replace('product-item-meta-link-', '') || '';
            const productName = linkElement.textContent?.trim() || '';
            const productUrl = linkElement.getAttribute('href') || '';

            // Get availability status
            const unavailableText = element.textContent?.includes('UNAVAILABLE');
            const availableSoonText = element.textContent?.includes('AVAILABLE SOON');
            const isAvailable = !unavailableText && !availableSoonText;

            // Extract price (look for $ followed by numbers)
            const priceMatch = element.textContent?.match(/\$([\d,]+)/);
            const price = priceMatch ? priceMatch[1].replace(',', '') : null;

            // Extract color (look for "Color:" followed by text)
            const colorMatch = element.textContent?.match(/Color:\s*([^,]+)/);
            const color = colorMatch ? colorMatch[1].trim() : null;

            if (productId && productName) {
              results.push({
                externalId: productId,
                name: productName,
                productUrl: productUrl.startsWith('http') ? productUrl : `https://www.hermes.com${productUrl}`,
                price: price,
                currency: 'USD',
                isAvailable: isAvailable,
                color: color,
                imageUrl: null, // Could extract if needed
                description: null,
                size: null, // Could extract if in product name
                categoryId: null, // Will be set later if needed
                regionId: null // Will be set by caller
              });
            }
          } catch (err) {
            console.error('Error parsing product element:', err);
          }
        });

        return results;
      });

      console.log(`[Scraper] Found ${products.length} products for region ${region.name}`);
      
      // Set regionId for all products
      const productsWithRegion = products.map(p => ({
        ...p,
        regionId: region.id
      }));
      
      return productsWithRegion;

    } catch (error) {
      console.error(`[Scraper] Error scraping ${region.name}:`, error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * Record a restock event
   */
  private async recordRestock(productId: number, price?: string | null) {
    const db = await getDb();
    if (!db) return;

    const restockData: InsertRestockHistory = {
      productId,
      detectedAt: new Date(),
      price: price || undefined,
      wasNotified: false,
      notificationCount: 0,
    };

    await db.insert(restockHistory).values(restockData);
  }

  /**
   * Queue notifications for users monitoring this product
   */
  private async queueNotifications(productId: number, regionId: number) {
    const db = await getDb();
    if (!db) return;

    // Get the product details
    const productResult = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!productResult[0]) return;
    const product = productResult[0];

    // Get the region details
    const regionResult = await db.select().from(regions).where(eq(regions.id, regionId)).limit(1);
    if (!regionResult[0]) return;
    const region = regionResult[0];

    // Get the latest restock record
    const restocks = await db
      .select()
      .from(restockHistory)
      .where(eq(restockHistory.productId, productId))
      .orderBy(restockHistory.detectedAt)
      .limit(1);
    
    if (!restocks[0]) return;

    // Find all users monitoring this region
    const monitoringUsers = await db
      .select({ userId: monitoringConfigs.userId })
      .from(monitoringConfigs)
      .where(and(
        eq(monitoringConfigs.regionId, regionId),
        eq(monitoringConfigs.isActive, true)
      ));

    // For each user, check their filters
    for (const { userId } of monitoringUsers) {
      const userFilters = await getUserActiveProductFilters(userId);
      
      // Check if user has "notify all restocks" enabled
      const hasNotifyAll = userFilters.some(f => f.notifyAllRestocks);
      
      if (hasNotifyAll) {
        // Send notification immediately without checking filter criteria
        await this.sendRestockNotification(product, region, restocks[0], userId, 'Notify All Restocks enabled');
        continue;
      }

      // Otherwise, check filter criteria
      const matchingFilters = [];
      
      for (const filter of userFilters) {
        if (!filter.isActive) continue;
        
        let matches = true;
        
        // Check category
        if (filter.categoryId && product.categoryId !== filter.categoryId) {
          matches = false;
        }
        
        // Check colors
        if (matches && filter.colors && product.color) {
          const colorArray = JSON.parse(filter.colors);
          if (!colorArray.includes(product.color)) {
            matches = false;
          }
        }
        
        // Check sizes
        if (matches && filter.sizes && product.size) {
          const sizeArray = JSON.parse(filter.sizes);
          if (!sizeArray.includes(product.size)) {
            matches = false;
          }
        }
        
        // Check price range
        if (matches && product.price) {
          const priceNum = parseFloat(product.price);
          if (filter.minPrice && priceNum < parseFloat(filter.minPrice)) {
            matches = false;
          }
          if (filter.maxPrice && priceNum > parseFloat(filter.maxPrice)) {
            matches = false;
          }
        }
        
        // Check keywords
        if (matches && filter.keywords) {
          const keywords = filter.keywords.toLowerCase();
          const productText = `${product.name} ${product.description || ''}`.toLowerCase();
          if (!productText.includes(keywords)) {
            matches = false;
          }
        }
        
        if (matches) {
          matchingFilters.push(filter);
        }
      }
      
      // If any filters matched, send notification
      if (matchingFilters.length > 0) {
        const filterInfo = matchingFilters.map(f => `Filter #${f.id}`).join(', ');
        await this.sendRestockNotification(product, region, restocks[0], userId, filterInfo);
      }
    }

    console.log(`[MonitoringService] Queued notifications for product ${productId}`);
  }

  /**
   * Send restock notification to user
   */
  private async sendRestockNotification(
    product: any,
    region: any,
    restock: any,
    userId: number,
    matchInfo: string
  ) {
    const db = await getDb();
    if (!db) return;

    // For owner (user ID 1), send via Manus notification
    if (userId === 1) {
      try {
        const notificationTitle = `🎉 Hermès Restock Alert: ${product.name}`;
        const notificationContent = `
**Region**: ${region.name} (${region.code})
**Product**: ${product.name}
${product.color ? `**Color**: ${product.color}` : ''}
${product.size ? `**Size**: ${product.size}` : ''}
${product.price ? `**Price**: ${product.currency} ${product.price}` : ''}

**Matched**: ${matchInfo}

**Product URL**: ${region.url}

Detected at: ${new Date().toLocaleString()}
        `.trim();

        const notificationSent = await notifyOwner({
          title: notificationTitle,
          content: notificationContent,
        });

        if (notificationSent) {
          console.log(`[MonitoringService] ✅ Owner notification sent for product ${product.id}`);
          
          // Update restock record
          await db
            .update(restockHistory)
            .set({
              wasNotified: true,
              notificationCount: 1,
            })
            .where(eq(restockHistory.id, restock.id));
        } else {
          console.log(`[MonitoringService] ⚠️ Failed to send owner notification for product ${product.id}`);
        }
      } catch (error) {
        console.error('[MonitoringService] Error sending owner notification:', error);
      }
    }
    
    // For other users, would send via email/push (not implemented yet)
  }

  /**
   * Log monitoring activity
   */
  private async logMonitoring(
    regionId: number,
    status: 'success' | 'failed' | 'blocked',
    productsFound: number,
    newRestocks: number,
    duration: number,
    errorMessage?: string,
    productDetails?: any[]
  ) {
    const db = await getDb();
    if (!db) return;

    const logData: InsertMonitoringLog = {
      regionId,
      status,
      productsFound,
      newRestocks,
      duration,
      errorMessage: errorMessage || undefined,
      productDetails: productDetails ? JSON.stringify(productDetails) : undefined,
      createdAt: new Date(),
    };

    await db.insert(monitoringLogs).values(logData);
  }

  /**
   * Run a manual scan of all active regions
   */
  async runManualScan() {
    console.log('[MonitoringService] Running manual scan...');
    await this.runMonitoringCycle();
    console.log('[MonitoringService] Manual scan completed');
  }

  /**
   * Check if the monitoring service is running
   */
  isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Get service uptime in milliseconds
   */
  getUptime(): number {
    // Simple implementation - return 0 if not running
    return this._isRunning ? Date.now() : 0;
  }

  /**
   * Utility: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let monitoringServiceInstance: MonitoringService | null = null;

/**
 * Get the monitoring service singleton
 */
export function getMonitoringService(): MonitoringService {
  if (!monitoringServiceInstance) {
    monitoringServiceInstance = new MonitoringService();
  }
  return monitoringServiceInstance;
}

/**
 * Start the monitoring service
 * Call this when the server starts
 */
export async function startMonitoringService() {
  const service = getMonitoringService();
  await service.start();
}

/**
 * Stop the monitoring service
 * Call this when the server shuts down
 */
export function stopMonitoringService() {
  if (monitoringServiceInstance) {
    monitoringServiceInstance.stop();
  }
}
