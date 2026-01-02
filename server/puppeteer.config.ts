/**
 * Puppeteer Configuration
 * 
 * Centralized configuration for Puppeteer browser automation.
 * This ensures the Chromium executable path is consistently used across all imports.
 */

import { homedir } from 'os';
import { join } from 'path';

// Chromium executable path
export const CHROMIUM_EXECUTABLE_PATH = '/home/ubuntu/.cache/puppeteer/chrome/linux-143.0.7499.169/chrome-linux64/chrome';

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

console.log('[Puppeteer Config] Chromium path:', CHROMIUM_EXECUTABLE_PATH);
console.log('[Puppeteer Config] Cache directory:', PUPPETEER_CACHE_DIR);
