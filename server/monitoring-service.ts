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

import { getDb, getUserProductFilters } from './db';
import { notifyOwner } from './_core/notification';
import { 
  regions, 
  products, 
  restockHistory, 
  notifications, 
  monitoringLogs,
  scanLogs,
  monitoringConfigs,
  type Region,
  type Product,
  type InsertProduct,
  type InsertRestockHistory,
  type InsertNotification,
  type InsertMonitoringLog,
  type InsertScanLog,
} from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * MonitoringService handles the core monitoring logic
 */
export class MonitoringService {
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL_MS = 30000; // 30 seconds

  /**
   * Start the monitoring service
   */
  async start() {
    if (this.isRunning) {
      console.log('[MonitoringService] Already running');
      return;
    }

    console.log('[MonitoringService] Starting...');
    this.isRunning = true;

    // Run initial scan
    await this.runMonitoringCycle();

    // Schedule periodic scans
    this.monitoringInterval = setInterval(async () => {
      await this.runMonitoringCycle();
    }, this.MONITORING_INTERVAL_MS);

    console.log('[MonitoringService] Started successfully');
  }

  /**
   * Manually trigger a scan of all monitored regions
   */
  public async manualScan(): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    console.log('[MonitoringService] Manual scan triggered');

    // Get all regions being monitored
    const monitoredRegions = await db
      .select()
      .from(regions)
      .innerJoin(
        monitoringConfigs,
        eq(regions.id, monitoringConfigs.regionId)
      )
      .where(eq(monitoringConfigs.isActive, true));

    // Monitor each region
    for (const { regions: region } of monitoredRegions) {
      await this.monitorRegion(region);
      await this.delay(2000); // Delay between regions
    }

    console.log('[MonitoringService] Manual scan completed');
  }

  /**
   * Stop the monitoring service
   */
  public stop() { if (!this.isRunning) {
      return;
    }

    console.log('[MonitoringService] Stopping...');
    this.isRunning = false;

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
          const insertResult = await db.insert(products).values(scrapedProduct);
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

      // Log successful scan
      const duration = Date.now() - startTime;
      await this.logScan(region.id, 'success', productsFound, newRestocks, duration, undefined, scrapedProducts);

      if (newRestocks > 0) {
        console.log(`[MonitoringService] Found ${newRestocks} new restocks in ${region.name}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logScan(region.id, 'failed', 0, 0, duration, errorMessage);
      console.error(`[MonitoringService] Error monitoring ${region.name}:`, error);
    }
  }

  /**
   * Scrape a region's website for products
   * In production, this woul  /**
   * Scrape a region's Hermès website for products
   */
  private async scrapeRegionWebsite(region: Region): Promise<InsertProduct[]> {
    // Import puppeteer dynamically to avoid build issues
    let puppeteer, StealthPlugin;
    try {
      puppeteer = (await import('puppeteer-extra')).default;
      StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
      puppeteer.use(StealthPlugin());
    } catch (error) {
      console.error('[MonitoringService] Failed to load puppeteer:', error);
      return [];
    }

    let browser;
    try {
      console.log(`[MonitoringService] Launching browser for ${region.name}...`);
      
      // Launch browser with stealth mode
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080',
        ],
      });

      const page = await browser.newPage();
      
      // Set realistic viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Add random delay to appear more human-like
      const randomDelay = () => new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      await randomDelay();

      console.log(`[MonitoringService] Navigating to ${region.url}...`);
      await page.goto(region.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await randomDelay();

      // Extract products from the page
      // NOTE: This is a generic scraper. Hermès website structure may vary by region.
      // You may need to adjust selectors based on actual website structure.
      const products = await page.evaluate((regionId: number) => {
        const productElements = document.querySelectorAll('[data-product], .product-item, .product-card');
        const results: any[] = [];

        productElements.forEach((el: Element) => {
          try {
            // Try to extract product information
            // These selectors are generic and may need adjustment
            const nameEl = el.querySelector('.product-name, .product-title, h2, h3');
            const priceEl = el.querySelector('.product-price, .price, [data-price]');
            const linkEl = el.querySelector('a[href]');
            const imageEl = el.querySelector('img');

            if (nameEl && linkEl) {
              const name = nameEl.textContent?.trim() || '';
              const priceText = priceEl?.textContent?.trim() || '';
              const productUrl = (linkEl as HTMLAnchorElement).href;
              const imageUrl = imageEl ? (imageEl as HTMLImageElement).src : '';

              // Extract price and currency
              const priceMatch = priceText.match(/([A-Z$€£¥]+)\s*([\d,]+(?:\.\d{2})?)/i);
              let price = null;
              let currency = null;
              if (priceMatch) {
                currency = priceMatch[1];
                price = priceMatch[2].replace(/,/g, '');
              }

              results.push({
                regionId,
                name,
                price,
                currency,
                productUrl,
                imageUrl,
                isAvailable: true,
              });
            }
          } catch (error) {
            console.error('Error parsing product element:', error);
          }
        });

        return results;
      }, region.id);

      console.log(`[MonitoringService] Found ${products.length} products on ${region.name}`);
      return products;

    } catch (error) {
      console.error(`[MonitoringService] Error scraping ${region.name}:`, error);
      return [];
    } finally {
      if (browser) {
        await browser.close();
      }
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

    // Check which filters match this product (for owner)
    let matchedFilterInfo = '';
    try {
      const ownerFilters = await getUserProductFilters(1); // Assuming owner is user ID 1
      const matchingFilters = [];
      
      for (const filter of ownerFilters) {
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
      
      if (matchingFilters.length > 0) {
        matchedFilterInfo = `\n\n**Matched Filter(s)**: ${matchingFilters.map(f => `Filter #${f.id}`).join(', ')}`;
      }
    } catch (error) {
      console.error('[MonitoringService] Error checking filters:', error);
    }

    // Send notification to owner via Manus built-in notification
    try {
      const notificationTitle = `🎉 Hermès Restock Alert: ${product.name}`;
      const notificationContent = `
**Region**: ${region.name} (${region.code})
**Product**: ${product.name}
${product.color ? `**Color**: ${product.color}` : ''}
${product.size ? `**Size**: ${product.size}` : ''}
${product.price ? `**Price**: ${product.currency} ${product.price}` : ''}${matchedFilterInfo}

**Product URL**: ${region.url}

Detected at: ${new Date().toLocaleString()}
      `.trim();

      const notificationSent = await notifyOwner({
        title: notificationTitle,
        content: notificationContent,
      });

      if (notificationSent) {
        console.log(`[MonitoringService] ✅ Owner notification sent for product ${productId}`);
        
        // Update restock record
        await db
          .update(restockHistory)
          .set({
            wasNotified: true,
            notificationCount: 1,
          })
          .where(eq(restockHistory.id, restocks[0].id));
      } else {
        console.log(`[MonitoringService] ⚠️ Failed to send owner notification for product ${productId}`);
      }
    } catch (error) {
      console.error('[MonitoringService] Error sending owner notification:', error);
    }

    // In production, this would also:
    // 1. Find all users monitoring this region
    // 2. Check their product filters (OR logic between filters, AND within each filter):
    //    For each user, get all their active filters
    //    A product matches if it satisfies ANY filter (OR logic)
    //    Within each filter, ALL conditions must match (AND logic):
    //      - If categoryId is set, product.categoryId must equal filter.categoryId
    //      - If colors array is set, product.color must be in the array
    //      - If sizes array is set, product.size must be in the array
    //      - If minPrice is set, product.price must be >= minPrice
    //      - If maxPrice is set, product.price must be <= maxPrice
    //      - If keywords is set, product name/description must contain keywords
    //    Example: User has Filter #1 (Lindy) OR Filter #2 (Birkin + Gold)
    //             Product matches if it's Lindy OR (Birkin AND Gold)
    // 3. Create notification records for matching users
    // 4. Send emails/push notifications via notification service

    console.log(`[MonitoringService] Queued notifications for product ${productId}`);
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
    errorMessage?: string
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
      createdAt: new Date(),
    };

    await db.insert(monitoringLogs).values(logData);
  }

  /**
   * Log scan activity to scan_logs table
   */
  private async logScan(
    regionId: number,
    status: 'success' | 'failed',
    productsFound: number,
    newRestocks: number,
    duration: number,
    errorMessage?: string,
    productDetails?: any[]
  ) {
    const db = await getDb();
    if (!db) return;

    const logData: InsertScanLog = {
      regionId,
      status,
      productsFound,
      newRestocks,
      duration,
      errorMessage: errorMessage || undefined,
      productDetails: productDetails ? JSON.stringify(productDetails) : undefined,
      createdAt: new Date(),
    };

    await db.insert(scanLogs).values(logData);
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
