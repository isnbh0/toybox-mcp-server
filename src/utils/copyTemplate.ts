import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively copy directory contents
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Skip .git and node_modules directories
      if (entry.name === '.git' || entry.name === 'node_modules') {
        continue;
      }
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Copy template files from local directory to destination
 */
export async function copyLocalTemplate(
  templatePath: string,
  destinationPath: string,
  replacements?: Record<string, string>
): Promise<void> {
  // Check if template directory exists
  try {
    await fs.access(templatePath);
  } catch (error) {
    throw new Error(`Template directory not found: ${templatePath}`);
  }

  // Create destination directory
  await fs.mkdir(destinationPath, { recursive: true });

  // Copy all files from template to destination
  await copyDirectory(templatePath, destinationPath);

  // Apply replacements if provided
  if (replacements) {
    await applyReplacements(destinationPath, replacements);
  }
}

/**
 * Get the default template path
 */
export function getDefaultTemplatePath(): string {
  // Go up from src/utils to reach the MCP server root, then into template
  return path.join(__dirname, '..', '..', 'template');
}

/**
 * Validate that a template directory has required files
 */
export async function validateTemplate(templatePath: string): Promise<boolean> {
  const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'index.html',
    'src',
    'TOYBOX_CONFIG.json',
  ];

  for (const file of requiredFiles) {
    try {
      await fs.access(path.join(templatePath, file));
    } catch (error) {
      return false;
    }
  }

  return true;
}

/**
 * Apply text replacements to files in a directory
 */
async function applyReplacements(
  directoryPath: string,
  replacements: Record<string, string>
): Promise<void> {
  const filesToProcess = [
    'package.json',
    'vite.config.ts',
    'vite.config.js',
    'src/components/AboutPage.tsx',
    'index.html',
    'public/404.html',
  ];

  for (const file of filesToProcess) {
    const filePath = path.join(directoryPath, file);
    
    try {
      await fs.access(filePath);
      let content = await fs.readFile(filePath, 'utf8');
      
      // Apply all replacements
      for (const [placeholder, replacement] of Object.entries(replacements)) {
        content = content.replace(new RegExp(placeholder, 'g'), replacement);
      }
      
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      // File doesn't exist, skip it
    }
  }
}