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
