/**
 * Puppeteer Configuration
 * 
 * Centralized configuration for Puppeteer browser automation.
 * This ensures the Chromium executable path is consistently used across all imports.
 */

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import puppeteer from 'puppeteer';

// Possible Chromium paths (try in order)
const CHROMIUM_PATHS = [
  '/usr/bin/chromium-browser',     // Ubuntu/Debian system Chromium
  '/usr/bin/chromium',              // Alternative system Chromium
  '/usr/bin/google-chrome',         // Google Chrome
  '/usr/bin/google-chrome-stable',  // Google Chrome stable
];

// Possible Puppeteer cache directories
const CACHE_DIRS = [
  '/root/.cache/puppeteer',         // Production environment (root user)
  '/home/ubuntu/.cache/puppeteer',  // Development sandbox
  join(process.env.HOME || '~', '.cache', 'puppeteer'), // Current user home
];

/**
 * Find Chrome executable in Puppeteer cache directories
 */
function findChromeInCache(): string | undefined {
  for (const cacheDir of CACHE_DIRS) {
    if (!existsSync(cacheDir)) continue;
    
    try {
      const chromeDir = join(cacheDir, 'chrome');
      if (!existsSync(chromeDir)) continue;
      
      // Find the latest Chrome version directory
      const versions = readdirSync(chromeDir);
      for (const version of versions.sort().reverse()) {
        const chromePath = join(chromeDir, version, 'chrome-linux64', 'chrome');
        if (existsSync(chromePath)) {
          console.log('[Puppeteer Config] Found Chrome in cache:', chromePath);
          return chromePath;
        }
      }
    } catch (error) {
      console.warn(`[Puppeteer Config] Error checking cache dir ${cacheDir}:`, error);
    }
  }
  return undefined;
}

/**
 * Find first available Chromium executable
 */
function findChromiumPath(): string | undefined {
  // First, try system paths
  for (const path of CHROMIUM_PATHS) {
    if (existsSync(path)) {
      console.log('[Puppeteer Config] Found system Chromium:', path);
      return path;
    }
  }
  
  // Then, try Puppeteer cache directories
  const cachedChrome = findChromeInCache();
  if (cachedChrome) {
    return cachedChrome;
  }
  
  // Finally, try Puppeteer's built-in executablePath()
  try {
    const bundledPath = puppeteer.executablePath();
    if (bundledPath && existsSync(bundledPath)) {
      console.log('[Puppeteer Config] Found bundled Chromium:', bundledPath);
      return bundledPath;
    }
  } catch (error) {
    console.warn('[Puppeteer Config] Failed to get bundled Chromium path:', error);
  }
  
  // If nothing found, return undefined (Puppeteer will try to download)
  console.warn('[Puppeteer Config] No Chromium found, Puppeteer will attempt to download');
  return undefined;
}

export const CHROMIUM_EXECUTABLE_PATH = findChromiumPath();

// Puppeteer cache directory (prefer /root/.cache in production)
export const PUPPETEER_CACHE_DIR = process.env.NODE_ENV === 'production' 
  ? '/root/.cache/puppeteer'
  : join(process.env.HOME || '~', '.cache', 'puppeteer');

// Set environment variables if path is found
if (CHROMIUM_EXECUTABLE_PATH) {
  process.env.PUPPETEER_EXECUTABLE_PATH = CHROMIUM_EXECUTABLE_PATH;
}
process.env.PUPPETEER_CACHE_DIR = PUPPETEER_CACHE_DIR;

// Default launch options
export const DEFAULT_LAUNCH_OPTIONS = {
  headless: true,
  ...(CHROMIUM_EXECUTABLE_PATH ? { executablePath: CHROMIUM_EXECUTABLE_PATH } : {}),
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920x1080'
  ]
};

console.log('[Puppeteer Config] Checking Chromium paths:');
CHROMIUM_PATHS.forEach(path => {
  console.log(`  ${existsSync(path) ? '✓' : '✗'} ${path}`);
});
console.log('[Puppeteer Config] Checking cache directories:');
CACHE_DIRS.forEach(dir => {
  console.log(`  ${existsSync(dir) ? '✓' : '✗'} ${dir}`);
});
console.log('[Puppeteer Config] Using Chromium path:', CHROMIUM_EXECUTABLE_PATH || 'Puppeteer bundled (auto-download)');
console.log('[Puppeteer Config] Cache directory:', PUPPETEER_CACHE_DIR);
