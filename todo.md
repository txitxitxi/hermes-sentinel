# Hermes Sentinel TODO

## Phase 1: Database Schema & Technical Design
- [x] Design database schema for users, subscriptions, monitoring configs, products, restock history
- [x] Create database tables and relationships
- [x] Set up monitoring service architecture

## Phase 2: User Authentication & Subscription Management
- [x] Implement user profile page with subscription status
- [x] Create subscription plan management (free trial + paid plans)
- [x] Build subscription upgrade/downgrade flow
- [ ] Add payment integration preparation

## Phase 3: Monitoring Configuration & Product Filtering
- [x] Create monitoring configuration page for region selection
- [x] Build product filter settings (bag type, color, size, price range)
- [x] Implement user preference saving and loading
- [x] Add supported regions and product types data

## Phase 4: Backend Monitoring Service & Notification System
- [x] Build headless browser monitoring service architecture
- [x] Implement proxy IP rotation system architecture
- [x] Create product change detection logic
- [x] Build email notification service
- [ ] Add push notification support (architecture ready)
- [x] Implement notification queue and delivery tracking

## Phase 5: Restock History & Trend Display
- [x] Create restock history recording system
- [x] Build history viewing page with filters
- [ ] Implement trend analysis and visualization
- [ ] Add product availability statistics

## Phase 6: Admin Dashboard & System Monitoring
- [x] Create admin dashboard layout
- [x] Build user management interface
- [x] Add subscription statistics and analytics
- [x] Implement system health monitoring
- [ ] Create monitoring service control panel

## Phase 7: Testing & Performance Optimization
- [x] Write unit tests for critical functions
- [ ] Test monitoring accuracy and speed
- [x] Optimize notification delivery performance
- [ ] Test multi-user concurrent access
- [ ] Verify payment flow

## Phase 8: Final Delivery
- [x] Create user documentation
- [x] Prepare deployment guide
- [x] Final system review and delivery
- [x] Create checkpoint and deliver to user

## Production Implementation Notes

### Requires Implementation for Production:
1. **Headless Browser Scraping** (server/monitoring-service.ts)
   - Integrate Puppeteer or Playwright
   - Add stealth plugins for anti-detection
   - Implement actual product parsing logic

2. **Proxy IP Rotation**
   - Configure proxy service provider
   - Implement IP rotation in monitoring service

3. **Email Service Integration** (server/email-service.ts)
   - Set up SendGrid, AWS SES, or similar
   - Configure email templates and delivery

4. **Payment Processing**
   - Integrate Stripe or payment provider
   - Implement subscription payment flow

5. **Push Notifications**
   - Implement Web Push API
   - Set up notification service worker

## Feature: Notify All Restocks Switch
- [x] Add notifyAllRestocks boolean field to product_filters table
- [x] Run database migration
- [x] Update monitoring service notification logic to check notifyAllRestocks flag
- [x] Update saveFilter mutation to accept notifyAllRestocks parameter
- [x] Add UI switch in product filter settings page
- [x] Update filter creation/edit forms to include the switch
- [x] Add Switch component with Bell icon and clear description
- [ ] Test notification with notifyAllRestocks enabled

## Bug Fix: Broken Navigation and Missing Admin Panel
- [x] Investigate DashboardLayout navigation configuration
- [x] Fix sidebar showing "Page 1" and "Page 2" instead of proper labels
- [x] Restore proper menuItems: Dashboard, Monitoring, Product Filters, Restock History, Subscription
- [x] Add adminMenuItems with Admin Panel (only visible to admin users)
- [x] Add role-based rendering for admin menu items
- [x] Import missing icons (Filter, History, CreditCard, Shield)
- [x] Verify all navigation links work correctly

## Bug Fix: Admin Panel Missing Control Section and Region ID Display
- [x] Restore "Monitoring Service Control" card with Start/Stop/Manual Scan buttons
- [x] Restore AdminPanel.tsx from checkpoint 78513ba (had full monitoring controls)
- [x] Add all missing admin API mutations to routers.ts (getScanLogs, getMonitoringStatus, startMonitoring, stopMonitoring, manualScan, sendTestNotification)
- [x] Fix import errors (getMonitoringService from monitoring-service.ts)
- [x] Use monitoringLogs table instead of non-existent scanLogs table
- [x] Add type assertions to bypass tRPC type caching issues
- [x] Fix TypeScript compilation (0 errors)
- [x] Fix "Monitoring System Logs" showing "Region ID" - getScanLogs now joins regions table to return regionName

## Bug Fixes: Multiple Admin Panel and Navigation Issues
- [x] Fix home page not redirecting subscribed users to dashboard
- [x] Enable Manual Scan button (removed isRunning dependency)
- [x] Fix scan history showing region IDs instead of region names (updated both getScanLogs and getRecentMonitoringLogs to join regions table)
- [x] Add "Clear History" button to scan logs section (with confirmation dialog)

## Bug Fix: Manual Scan Failure
- [x] Identified missing runManualScan() method in MonitoringService class
- [x] Added runManualScan(), isRunning(), and getUptime() methods
- [x] Fixed naming conflict by renaming isRunning property to _isRunning
- [x] TypeScript compilation successful with no errors

## Feature: Optimize Scraping with Direct Bags Category URLs
- [x] Update United States region URL to https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/bags-and-clutches/#|
- [ ] Inspect bags category page HTML structure to identify correct product selectors
- [ ] Update scraping CSS selectors in monitoring-service.ts to match actual product elements
- [ ] Test scraping with new URL and selectors
- [ ] Update other region URLs to their respective bags category pages (future enhancement)


## Feature: Real Puppeteer Web Scraping Implementation
- [x] Install Puppeteer and Chromium browser
- [x] Implement real browser automation in scrapeRegionWebsite()
- [x] Add correct Hermès website selectors (div[role="button"], a[id^="product-item-meta-link-"])
- [x] Extract product data: name, price, color, availability, external_id
- [x] Fix database field mapping (url → productUrl)
- [x] Fix NULL value handling for optional fields (categoryId, description, etc.)
- [x] Add productDetails field to monitoring_logs schema
- [x] Update getScanLogs to include productDetails
- [x] Increase selector timeout from 30s to 60s
- [x] Test manual scan - successfully detected 25 products from US region
- [ ] Fix "Scan Activity Logs" UI display issue (products saving correctly, just UI not showing)
- [ ] Investigate region-specific selector differences for UK/France/Germany
- [ ] Add image URL extraction
- [ ] Add product category detection


## Feature: Disable All Non-US Regions
- [x] Update regions table to set is_active=false for all regions except United States
- [x] Verify monitoring service only scans active regions
- [x] Test manual scan with US-only configuration (completed in ~12 seconds, detected 25 products)


## Bug Fixes: Region Filtering, Puppeteer Cache, and UI Issues
- [x] Fix region filtering - system still scanning Taiwan despite is_active=false (SQL UPDATE fixed)
- [x] Fix Puppeteer cache path error (/root/.cache/puppeteer vs /home/ubuntu/.cache/puppeteer) (added PUPPETEER_CACHE_DIR env var)
- [x] Remove redundant "Scan Activity Logs" section from Admin Panel
- [x] Move "Clear History" button from Scan Activity Logs to Monitoring System Logs section
- [x] Verify only US region is scanned after fixes (confirmed: only 1 scan log for US, 25 products detected)


## Bug: Puppeteer Cache Path Still Failing
- [x] Investigate why PUPPETEER_CACHE_DIR environment variable is not being applied (env var doesn't work, need explicit path)
- [x] Find correct Chromium executable path in /home/ubuntu/.cache/puppeteer (found: /home/ubuntu/.cache/puppeteer/chrome/linux-143.0.7499.169/chrome-linux64/chrome)
- [x] Set executablePath directly in puppeteer.launch() configuration
- [x] Test manual scan to verify Chromium launches successfully (verified: 24 products detected, no errors)


## Bug: Chromium Executable Not Found & Clear History Not Working
- [x] Check Chromium file permissions and verify executable path (file exists with -rwxr-xr-x permissions)
- [x] Fix executablePath by setting PUPPETEER_EXECUTABLE_PATH env var before importing puppeteer
- [x] Fix clearScanLogs mutation to refetch correct query (changed from refetchScanLogs to refetch)
- [x] Test Clear History button deletes all logs successfully (verified with SQL query, UI updates after server restart)
- [x] Test manual scan works with corrected Chromium path (verified: 24 products detected, scan completed successfully)

## Bug: Clear History Button Not Deleting Logs

- [x] Investigate why clearScanLogs mutation doesn't delete records from database (backend works, Safari-specific frontend issue)
- [ ] Check if mutation is being called correctly from frontend (window.confirm() not triggering in Safari)
- [x] Fix database deletion logic in clearScanLogs mutation (backend mutation works correctly)
- [ ] Test Clear History button successfully removes all logs (needs alternative to window.confirm for Safari compatibility)

## Bug: Restock History Showing Product IDs Instead of Names
- [x] Update getRestockHistory query to join products table (getRecentRestockHistory now joins products)
- [x] Display product name instead of "Product ID: X" (History.tsx updated to show productName)
- [x] Test Restock History page shows actual product names (verified working)

## Remaining Issues
- [ ] Fix Clear History button Safari compatibility (window.confirm not working, needs alternative UI approach)
- [ ] Update Dashboard Recent Restock Activity to show product names (needs same fix as History page)


## Fix: Remove Clear History Confirmation & Fix Dashboard Product Names
- [x] Remove window.confirm() from Clear History button (direct delete without popup)
- [x] Update Dashboard getRecentRestockHistory query to join products table (already done in previous fix)
- [x] Update Dashboard.tsx to display product names instead of "Product #24" (now shows productName || fallback to Product #ID)
- [ ] Test Clear History button deletes logs without confirmation (frontend tRPC caching issue - backend DELETE works, UI doesn't update)
- [x] Test Dashboard shows actual product names (verified: "So Medor bag", "Neo Double Sens 35 unicolor bag", "Poche Cliquetis bag")

## Known Issues
- Clear History button: tRPC query caching prevents UI from updating after deletion (backend works correctly, frontend refetch not working)


## Critical Bug: Chromium Path Error Returned & Monitoring Won't Start
- [x] Investigate why PUPPETEER_EXECUTABLE_PATH environment variable was lost after restart
- [x] Verify monitoring-service.ts still has the environment variable set at top of file
- [x] Fix Chromium path permanently so it persists across restarts
- [x] Test Start monitoring button works after fix

## Bug: Clear History Button Caching Issue
- [ ] Replace refetchMonitoringLogs() with queryClient.invalidateQueries()
- [ ] Test Clear History button properly updates UI after deletion


## Session 2026-01-02: Chromium Path Fix (Persistent Solution)
- [x] Created centralized Puppeteer configuration file (server/puppeteer.config.ts)
- [x] Updated monitoring-service.ts to import and use DEFAULT_LAUNCH_OPTIONS
- [x] Verified Manual Scan works successfully with new config (detected 24 products)
- [x] Identified root cause: Old monitoring service process still running with old code
- [x] Stop old monitoring service instance (added process exit handlers)
- [x] Verify automatic monitoring works with new configuration after clean restart
- [x] Test Start Monitoring button to ensure 30-second interval scanning works
- [x] Create checkpoint once all issues resolved

### Technical Details
- Created `server/puppeteer.config.ts` with CHROMIUM_EXECUTABLE_PATH constant
- Exports DEFAULT_LAUNCH_OPTIONS with all Puppeteer settings
- Sets environment variables immediately on module import
- Monitoring service imports config FIRST before other dependencies
- Manual scan confirmed working: "✅ Manual scan completed successfully" + 24 products detected
- Issue: Old server process still running setInterval() with old code (fails every 30s)


### Final Solution Summary
**Problem**: Chromium executable path error caused monitoring service to fail after server restarts.

**Root Causes Identified**:
1. Environment variable `PUPPETEER_EXECUTABLE_PATH` set at runtime wasn't persisting across tsx watch hot reloads
2. Old monitoring service instances with setInterval() continued running after code changes
3. Singleton pattern kept old instances in memory during hot module reload

**Solution Implemented**:
1. **Centralized Configuration** (`server/puppeteer.config.ts`):
   - Hardcoded CHROMIUM_EXECUTABLE_PATH constant
   - Exported DEFAULT_LAUNCH_OPTIONS with all Puppeteer settings
   - Set environment variables immediately on module import
   
2. **Proper Cleanup** (added to `monitoring-service.ts`):
   - Process exit handlers (beforeExit, SIGTERM, SIGINT) to stop monitoring service
   - Hot module reload detection to stop old instances before creating new ones
   - Ensures setInterval() is cleared when server restarts

3. **Import Order** (in `monitoring-service.ts`):
   - Import puppeteer.config.ts FIRST before other dependencies
   - Ensures Chromium path is set before Puppeteer is loaded

**Verification**:
- ✅ Manual Scan: Successfully detected 24 products
- ✅ Automatic Monitoring: 5 consecutive successful scans every ~30 seconds
- ✅ Persistence: Configuration survives tsx watch restarts
- ✅ Cleanup: Old monitoring instances properly stopped

**Files Modified**:
- `server/puppeteer.config.ts` (new file)
- `server/monitoring-service.ts` (import config, add cleanup handlers)


## Session 2026-01-02 Part 2: Four Critical Issues to Fix

### Issue 1: Clear History Button Still Not Working
- [x] Replace tRPC refetch with proper cache invalidation
- [x] Use queryClient.invalidateQueries() instead of refetchMonitoringLogs()
- [ ] Test Clear History button successfully updates UI - **STILL NOT WORKING** (tRPC caching issue persists)

### Issue 2: Chromium Path Error Returned After Restart
- [x] Investigate why previous fix didn't persist (failed logs at 3:02-3:03 AM)
- [x] Check if server was restarted/redeployed and config was lost
- [x] Implement more robust solution that survives all restart scenarios
- [x] Test fix persists after hard restart - **FIXED** (import config at server startup in server/_core/index.ts)

### Issue 3: Add Scan Type Labels (Auto vs Manual)
- [x] Add scan_type field to monitoring_logs table schema (enum: 'auto' | 'manual')
- [x] Update monitoring service to set scan_type='auto' for automatic scans
- [x] Update manual scan to set scan_type='manual'
- [x] Update Admin Panel UI to display scan type label next to region name
- [ ] Test both auto and manual scans show correct labels - **INFRASTRUCTURE COMPLETE** (but manual scans still showing as 'auto' - debugging needed)

### Issue 4: Add Auto Scan Status Indicator
- [x] Add status indicator showing "Auto Scan Enabled" when monitoring is running
- [x] Show "Auto Scan Disabled" when monitoring is stopped
- [x] Update Service Status section in Admin Panel
- [x] Test status changes when Start/Stop buttons are clicked - **WORKING**
