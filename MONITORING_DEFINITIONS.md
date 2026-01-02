# Monitoring System Definitions

## Product Detection

### What is a "Product"?

A **product** is a unique item identified by its `externalId` (scraped from the Hermès website's product identifier). The system tracks products across scans to detect when they become available or unavailable.

**Key characteristics:**
- Each product has a unique `externalId` from the website
- Products are region-specific (same item in different regions = different products)
- Products have attributes: name, price, color, size, category, availability status

### What is a "New Restock"?

A **new restock** occurs in two scenarios:

1. **Never-seen-before product**: A product with an `externalId` that doesn't exist in our database
   - Example: Hermès releases a new Birkin bag model
   - This is counted as both a "new product" AND a "new restock"

2. **Previously unavailable product becomes available**: A product that was marked as `isAvailable: false` becomes `isAvailable: true` again
   - Example: A Kelly bag was sold out (removed from website), now it's back in stock
   - This is counted as a "restock" but not a "new product"

### Why Only 5 Products Found?

The current scraper uses **generic CSS selectors** that may not match the actual Hermès website structure:

```javascript
// Current selectors (in monitoring-service.ts line 286)
document.querySelectorAll('[data-product], .product-item, .product-card')
```

These selectors are placeholders for generic e-commerce sites. The Hermès website likely uses:
- Custom class names (e.g., `.hermes-product`, `.product-tile`)
- Different HTML structure
- Dynamic content loading (JavaScript-rendered products)
- Anti-scraping measures

**To improve detection:**
1. Inspect the actual Hermès website HTML structure
2. Update CSS selectors in `server/monitoring-service.ts` (line 286)
3. Handle dynamic content loading (wait for products to render)
4. Add more robust product extraction logic

## Scan Logs

### Scan Log Fields

- **Products Found**: Total number of products detected during the scan
- **New Restocks**: Number of products that are either:
  - Never seen before (new `externalId`), OR
  - Previously unavailable but now available again
- **Duration**: Time taken to complete the scan (in milliseconds)
- **Product Details**: JSON array of all detected products with:
  - `name`: Product name
  - `price`: Product price (if available)
  - `currency`: Currency symbol
  - `productUrl`: Link to the product page
  - `imageUrl`: Product image URL
  - `isAvailable`: Always `true` for detected products

### Viewing Detected Products

In the Admin Panel > Scan Activity Logs:
1. Find a scan log entry
2. Click "▶ Show Detected Products" button
3. View all products that were found during that scan
4. Use this information to debug why certain products aren't being detected

## Notification Logic

Notifications are sent when:
1. A new restock is detected (see definition above), AND
2. The product matches at least one of the user's active product filters

**Filter matching criteria:**
- Category must match (if filter has category set)
- Color must be in the filter's color list (if filter has colors set)
- Size must be in the filter's size list (if filter has sizes set)
- Price must be within min/max range (if filter has price range set)
- Product name/description must contain keywords (if filter has keywords set)

**If no filters match:**
- The restock is recorded in the database
- NO notification is sent
- You can still see the restock in the Admin Panel

## Next Steps

To improve product detection:
1. Run a manual scan and view detected products
2. Compare with actual Hermès website to see what's missing
3. Update CSS selectors in `server/monitoring-service.ts`
4. Consider using Hermès API if available (check network tab in browser DevTools)
5. Add retry logic for failed scans
6. Implement region-specific selectors (US site may differ from EU site)
