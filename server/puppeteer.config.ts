/**
 * Puppeteer Configuration
 * 
 * Centralized configuration for Puppeteer browser automation.
 * This ensures the Chromium executable path is consistently used across all imports.
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

// Possible Chromium paths (try in order)
const CHROMIUM_PATHS = [
  '/usr/bin/chromium-browser',     // Ubuntu/Debian system Chromium
  '/usr/bin/chromium',              // Alternative system Chromium
  '/usr/bin/google-chrome',         // Google Chrome
  '/usr/bin/google-chrome-stable',  // Google Chrome stable
  '/home/ubuntu/.cache/puppeteer/chrome/linux-143.0.7499.169/chrome-linux64/chrome', // Bundled Chromium (dev sandbox)
];

// Find first available Chromium executable
function findChromiumPath(): string {
  for (const path of CHROMIUM_PATHS) {
    if (existsSync(path)) {
      return path;
    }
  }
  // If none found, return the first path as fallback (will fail with clear error)
  return CHROMIUM_PATHS[0];
}

export const CHROMIUM_EXECUTABLE_PATH = findChromiumPath();

// Puppeteer cache directory
export const PUPPETEER_CACHE_DIR = join(homedir(), '.cache', 'puppeteer');

// Set environment variables immediately when this module is imported
process.env.PUPPETEER_EXECUTABLE_PATH = CHROMIUM_EXECUTABLE_PATH;
process.env.PUPPETEER_CACHE_DIR = PUPPETEER_CACHE_DIR;

// Default launch options
export const DEFAULT_LAUNCH_OPTIONS = {
  headless: true,
  executablePath: CHROMIUM_EXECUTABLE_PATH,
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
console.log('[Puppeteer Config] Using Chromium path:', CHROMIUM_EXECUTABLE_PATH);
console.log('[Puppeteer Config] Cache directory:', PUPPETEER_CACHE_DIR);
