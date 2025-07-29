/**
 * Central configuration constants for TOYBOX MCP Server
 * This file contains all default values to ensure consistency across the codebase
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const DEFAULTS = {
  // Template configuration
  TEMPLATE_OWNER: 'isnbh0',
  TEMPLATE_REPO: 'toybox-template',
  
  // User repository defaults
  USER_REPO_NAME: 'toybox',
  
  // Server configuration
  VERSION: packageJson.version as string,
  SERVER_NAME: 'toybox-mcp-server',
  
  // Directory paths
  TOYBOX_DIR: '.toybox',
  
  // Configuration defaults
  CONFIG: {
    THEME: 'auto',
    LAYOUT: 'grid',
    SHOW_FOOTER: true,
    AUTO_COMMIT: true,
    COMMIT_MESSAGE: 'feat: Add new artifact via TOYBOX',
  }
} as const;

export const DESCRIPTIONS = {
  REPO_NAME: 'Name for the repository (default: toybox)',
  TEMPLATE_OWNER: 'GitHub username or organization that owns the TOYBOX template (default: isnbh0)',
  TEMPLATE_REPO: 'Name of the template repository (default: toybox-template)',
} as const;