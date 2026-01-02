/**
 * Puppeteer Configuration
 * 
 * Centralized configuration for Puppeteer browser automation.
 * This ensures the Chromium executable path is consistently used across all imports.
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import puppeteer from 'puppeteer';

// Possible Chromium paths (try in order)
const CHROMIUM_PATHS = [
  '/usr/bin/chromium-browser',     // Ubuntu/Debian system Chromium
  '/usr/bin/chromium',              // Alternative system Chromium
  '/usr/bin/google-chrome',         // Google Chrome
  '/usr/bin/google-chrome-stable',  // Google Chrome stable
];

// Find first available Chromium executable
function findChromiumPath(): string | undefined {
  // First, try system paths
  for (const path of CHROMIUM_PATHS) {
    if (existsSync(path)) {
      console.log('[Puppeteer Config] Found system Chromium:', path);
      return path;
    }
  }
  
  // If no system Chromium found, try to use Puppeteer's bundled Chromium
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

// Puppeteer cache directory
export const PUPPETEER_CACHE_DIR = join(homedir(), '.cache', 'puppeteer');

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
console.log('[Puppeteer Config] Using Chromium path:', CHROMIUM_EXECUTABLE_PATH || 'Puppeteer bundled (auto-download)');
console.log('[Puppeteer Config] Cache directory:', PUPPETEER_CACHE_DIR);
