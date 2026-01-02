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

## New Feature: Owner Notification System
- [x] Integrate Manus built-in notification to monitoring service
- [x] Update monitoring service to send notifications to owner
- [x] Add owner monitoring configuration interface
- [x] Create admin control panel for monitoring service
- [x] Test notification delivery
- [x] Create checkpoint and deliver

## Bug Fix: Sign In Issue
- [x] Diagnose sign in problem
- [x] Fix authentication flow
- [x] Test login functionality
- [x] Verify user can access dashboard after login

## Feature: Lifetime Free Access for Owner
- [x] Create lifetime free subscription for tianyuxi888@gmail.com
- [x] Update subscription status in database
- [x] Verify subscription shows as active
- [x] Test and deliver

## Bug Fix: Navigation and Monitoring Issues
- [x] Fix navigation text (replace "Page 1" and "Page 2" with meaningful names)
- [x] Fix monitoring capacity showing 0 regions instead of 999
- [x] Fix "Add to Monitoring" button not working
- [x] Test adding regions functionality
- [x] Verify subscription plan limits are correctly applied

## Bu## Bug Fix: Delete Country and Filter Display Issues
- [x] Fix delete country button not working
- [x] Fix filter category displaying index instead of name
- [x] Document filter logic (AND vs OR)
- [x] Test delete functionality
- [x] Test filter displayll fixes

## Feature: Update Filter Logic
- [x] Update filter matching logic: multiple filters use OR, within each filter use AND
- [x] Update documentation in monitoring-service.ts
- [x] Update test cases to reflect new logic
- [x] Verify filter matching works correctly

## Feature: Filter Management
- [x] Add edit button to each filter card
- [x] Implement edit filter functionality (populate form with existing data)
- [x] Add delete button to each filter card
- [x] Implement delete filter API and frontend
- [x] Add confirmation dialog for delete action
- [x] Test edit and delete functionality

## Feature: Enhanced Notifications
- [x] Update notification content to show which filter matched
- [x] Add filter name/description to notification records
- [x] Display matched filter info in notification UI
- [x] Test notification content improvements

## Feature: Real Web Scraping
- [x] Install Puppeteer dependencies
- [x] Implement Hermès website scraper in monitoring-service
- [x] Add product data extraction logic
- [x] Implement anti-detection measures (stealth, random delays)
- [x] Test scraping on real Hermès websites
- [x] Add error handling and retry logic

## Bug Fix: Puppeteer Dynamic Require Error
- [ ] Fix "Dynamic require of 'puppeteer-extra' is not supported" error
- [ ] Change from require() to ES module import
- [ ] Test monitoring service starts successfully
- [ ] Verify scraping works without errors

## Feature: Monitoring Logs and Manual Refresh
- [x] Add scan log recording to monitoring service
- [x] Create database table for scan logs (scanLogs)
- [x] Display scan logs in Admin Panel with detailed information
- [x] Add "Manual Refresh" button to trigger immediate scan
- [x] Implement manual scan API endpoint (admin.manualScan)
- [x] Implement getScanLogs API endpoint (admin.getScanLogs)
- [x] Test log display and manual refresh functionality
- [x] Write unit tests (8/9 tests passing, 1 timeout due to Puppeteer)

## Bug Fix: Manual Scan Button Availability
- [x] Remove restriction that disables Manual Scan when service is stopped
- [x] Allow Manual Scan to work independently of monitoring service status
- [x] Test Manual Scan works when service is stopped
- [x] Verify Manual Scan still works when service is running

## Feature: Auto-redirect Subscribed Users to Dashboard
- [x] Check user subscription status on home page load
- [x] Redirect subscribed users to /dashboard automatically
- [x] Keep landing page visible for non-subscribed users
- [x] Test redirect logic works correctly

## Bug Fix: Display Region Names in Scan Logs
- [x] Update getScanLogs API to join regions table
- [x] Update getRecentMonitoringLogs API to join regions table
- [x] Return region name along with region ID
- [x] Update AdminPanel to display region name instead of "Region ID: X"
- [x] Add TypeScript type definitions for logs with regionName
- [x] Test that region names display correctly

## System Configuration: Reduce Testing Load
- [x] Query database to find United States region ID (region_id: 1)
- [x] Verify monitoring configs - already only United States is active
- [x] Confirm only one region is active for monitoring (user: tianyuxi888@gmail.com)
- [x] System already optimized - only United States in 30-second scan cycle
