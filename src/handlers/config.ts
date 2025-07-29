import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { GitService } from '../services/git.js';
import { ArtifactService } from '../services/artifacts.js';
import { log } from '../utils/logger.js';
import { DEFAULTS } from '../constants.js';
import type { ToyboxConfig } from '../types.js';

export interface UpdateConfigResult {
  success: boolean;
  config: ToyboxConfig;
  message?: string;
  error?: string;
}

/**
 * Update TOYBOX configuration
 */
export async function updateConfig(configUpdates: Partial<ToyboxConfig>): Promise<UpdateConfigResult> {
  try {
    // Step 1: Find local TOYBOX repository
    log.info('Looking for local TOYBOX repository');
    const localPath = await findToyboxRepository();
    
    if (!localPath) {
      return {
        success: false,
        config: {} as ToyboxConfig,
        error: 'No TOYBOX repository found. Please run initialize_toybox first.',
      };
    }

    log.info('Found TOYBOX at path', { localPath });

    // Step 2: Initialize services
    const gitService = new GitService(localPath);
    const artifactService = new ArtifactService(localPath);

    // Step 3: Read current configuration
    const currentConfig = await artifactService.readConfig();
    
    // Step 4: Update configuration
    log.info('Updating configuration');
    await artifactService.updateConfig(configUpdates);
    
    // Step 5: Read updated configuration
    const updatedConfig = await artifactService.readConfig();

    // Step 6: Commit changes if there are any
    log.info('Committing configuration changes');
    
    // Pull latest changes first
    try {
      await gitService.pull();
    } catch (error) {
      log.warn('Could not pull changes, proceeding with local state');
    }

    // Stage configuration file
    await gitService.addFiles(['TOYBOX_CONFIG.json']);

    // Check if there are changes to commit
    const hasChanges = await gitService.hasUncommittedChanges();
    if (hasChanges) {
      const commitMessage = `feat: Update TOYBOX configuration\\n\\n` +
                           `Configuration changes:\\n` +
                           Object.entries(configUpdates)
                             .map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`)
                             .join('\\n');

      await gitService.commit(commitMessage);
      await gitService.push();
    }

    // Step 7: Format changes summary
    const changes = Object.entries(configUpdates)
      .filter(([key, value]) => currentConfig[key as keyof ToyboxConfig] !== value)
      .map(([key, value]) => `• ${key}: ${JSON.stringify(currentConfig[key as keyof ToyboxConfig])} → ${JSON.stringify(value)}`)
      .join('\\n');

    return {
      success: true,
      config: updatedConfig,
      message: `✅ TOYBOX configuration updated successfully!\\n\\n` +
               `Changes:\\n${changes || 'No changes detected'}\\n\\n` +
               `Current configuration:\\n` +
               `• Title: ${updatedConfig.title}\\n` +
               `• Description: ${updatedConfig.description}\\n` +
               `• Theme: ${updatedConfig.theme}\\n` +
               `• Layout: ${updatedConfig.layout}\\n` +
               `• Show Footer: ${updatedConfig.showFooter}\\n\\n` +
               `Your changes will be visible on the next site deployment.`,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      config: {} as ToyboxConfig,
      error: `Failed to update configuration: ${errorMessage}`,
    };
  }
}

/**
 * Get current TOYBOX configuration
 */
export async function getConfig(): Promise<UpdateConfigResult> {
  try {
    // Step 1: Find local TOYBOX repository
    const localPath = await findToyboxRepository();
    
    if (!localPath) {
      return {
        success: false,
        config: {} as ToyboxConfig,
        error: 'No TOYBOX repository found. Please run initialize_toybox first.',
      };
    }

    // Step 2: Read configuration
    const artifactService = new ArtifactService(localPath);
    const config = await artifactService.readConfig();

    return {
      success: true,
      config,
      message: `📋 Current TOYBOX configuration:\\n\\n` +
               `• Title: ${config.title}\\n` +
               `• Description: ${config.description}\\n` +
               `• Theme: ${config.theme}\\n` +
               `• Layout: ${config.layout}\\n` +
               `• Show Footer: ${config.showFooter}`,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      config: {} as ToyboxConfig,
      error: `Failed to read configuration: ${errorMessage}`,
    };
  }
}

/**
 * Find the local TOYBOX repository
 */
async function findToyboxRepository(): Promise<string | null> {
  const toyboxDir = path.join(os.homedir(), DEFAULTS.TOYBOX_DIR);
  
  // First check for any repositories in ~/.toybox
  const commonPaths = [
    path.join(toyboxDir, DEFAULTS.USER_REPO_NAME),
    path.join(toyboxDir, 'TOYBOX'),
    ...getDirectoriesInToybox(toyboxDir),
    // Legacy paths for backward compatibility
    path.join(os.homedir(), DEFAULTS.USER_REPO_NAME),
    path.join(os.homedir(), 'TOYBOX'),
  ];

  for (const repoPath of commonPaths) {
    const gitService = new GitService(repoPath);
    
    if (await gitService.repositoryExists() && await gitService.isGitRepository()) {
      const artifactService = new ArtifactService(repoPath);
      
      try {
        const config = await artifactService.readConfig();
        if (config) {
          return repoPath;
        }
      } catch {
        // Continue searching
      }
    }
  }

  return null;
}

/**
 * Get all directories in ~/.toybox
 */
function getDirectoriesInToybox(toyboxDir: string): string[] {
  try {
    if (!fs.existsSync(toyboxDir)) {
      return [];
    }
    
    return fs.readdirSync(toyboxDir)
      .filter((file: string) => {
        const filePath = path.join(toyboxDir, file);
        return fs.statSync(filePath).isDirectory();
      })
      .map((dir: string) => path.join(toyboxDir, dir));
  } catch {
    return [];
  }
}