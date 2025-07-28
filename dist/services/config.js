import fs from 'fs-extra';
import { readFile, writeFile, rename } from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';
import lockfile from 'proper-lockfile';
import { log } from '../utils/logger.js';
import { ToyboxConfigSchema, CONFIG_FILE_NAME, CONFIG_VERSION, createDefaultConfig } from '../types/config.js';
/**
 * Service for managing TOYBOX configuration
 * Implements safe file operations with atomic writes and locking
 */
export class ConfigService {
    configPath;
    lockRetries = 5;
    lockStale = 5000; // 5 seconds
    constructor(configPath) {
        this.configPath = configPath || path.join(os.homedir(), CONFIG_FILE_NAME);
    }
    /**
     * Read configuration from disk
     * Creates default config if file doesn't exist
     */
    async read() {
        try {
            // Check if config file exists
            const exists = await fs.pathExists(this.configPath);
            if (!exists) {
                // Create default config
                const defaultConfig = createDefaultConfig();
                await this.write(defaultConfig);
                return defaultConfig;
            }
            // Read and parse config
            const configData = await readFile(this.configPath, 'utf-8');
            const parsedConfig = JSON.parse(configData);
            // Validate with Zod schema
            const validatedConfig = ToyboxConfigSchema.parse(parsedConfig);
            // Migrate if needed
            const migratedConfig = await this.migrate(validatedConfig);
            return migratedConfig;
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                log.error('Invalid configuration format', { errors: error.errors });
                // Return default config on validation error
                const defaultConfig = createDefaultConfig();
                await this.write(defaultConfig);
                return defaultConfig;
            }
            throw new Error(`Failed to read configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Write configuration to disk with atomic operation
     * Uses write-rename pattern to prevent corruption
     */
    async write(config) {
        // Update lastUpdated timestamp
        config.lastUpdated = new Date().toISOString();
        // Validate config before writing
        const validatedConfig = ToyboxConfigSchema.parse(config);
        // Create temp file path
        const tempPath = `${this.configPath}.tmp`;
        try {
            // Ensure directory exists
            await fs.ensureDir(path.dirname(this.configPath));
            // Write to temp file
            await writeFile(tempPath, JSON.stringify(validatedConfig, null, 2), 'utf-8');
            // Atomic rename
            await rename(tempPath, this.configPath);
        }
        catch (error) {
            // Clean up temp file if it exists
            await fs.remove(tempPath).catch(() => { });
            throw new Error(`Failed to write configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Update configuration with locking to prevent concurrent modifications
     */
    async update(updater) {
        let release = null;
        try {
            // Acquire lock with retries
            release = await lockfile.lock(this.configPath, {
                retries: this.lockRetries,
                stale: this.lockStale,
            });
            // Read current config
            const currentConfig = await this.read();
            // Apply update
            const updatedConfig = await updater(currentConfig);
            // Write updated config
            await this.write(updatedConfig);
            return updatedConfig;
        }
        catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
                // File doesn't exist yet, create it
                const defaultConfig = createDefaultConfig();
                const updatedConfig = await updater(defaultConfig);
                await this.write(updatedConfig);
                return updatedConfig;
            }
            throw new Error(`Failed to update configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            // Always release lock
            if (release) {
                await release();
            }
        }
    }
    /**
     * Get active repository configuration
     */
    async getActiveRepository() {
        const config = await this.read();
        if (!config.activeRepository) {
            // Try to find a repository marked as active
            const activeRepo = config.repositories.find(r => r.isActive);
            return activeRepo || null;
        }
        return config.repositories.find(r => r.name === config.activeRepository) || null;
    }
    /**
     * Set active repository
     */
    async setActiveRepository(repoName) {
        await this.update(config => {
            // Ensure repository exists
            const repo = config.repositories.find(r => r.name === repoName);
            if (!repo) {
                throw new Error(`Repository '${repoName}' not found in configuration`);
            }
            // Update active flags
            config.repositories.forEach(r => {
                r.isActive = r.name === repoName;
            });
            config.activeRepository = repoName;
            return config;
        });
    }
    /**
     * Add or update repository configuration
     */
    async upsertRepository(repo) {
        await this.update(config => {
            const existingIndex = config.repositories.findIndex(r => r.name === repo.name);
            if (existingIndex >= 0) {
                // Update existing
                config.repositories[existingIndex] = {
                    ...config.repositories[existingIndex],
                    ...repo,
                    lastUsedAt: new Date().toISOString(),
                };
            }
            else {
                // Add new
                config.repositories.push({
                    ...repo,
                    createdAt: repo.createdAt || new Date().toISOString(),
                    lastUsedAt: new Date().toISOString(),
                });
            }
            // If this is the first repository, make it active
            if (config.repositories.length === 1) {
                config.activeRepository = repo.name;
                config.repositories[0].isActive = true;
            }
            return config;
        });
    }
    /**
     * Remove repository configuration
     */
    async removeRepository(repoName) {
        await this.update(config => {
            config.repositories = config.repositories.filter(r => r.name !== repoName);
            // Clear active repository if it was removed
            if (config.activeRepository === repoName) {
                config.activeRepository = undefined;
                // Make the first remaining repository active
                if (config.repositories.length > 0) {
                    config.repositories[0].isActive = true;
                    config.activeRepository = config.repositories[0].name;
                }
            }
            return config;
        });
    }
    /**
     * Get all repositories
     */
    async getRepositories() {
        const config = await this.read();
        return config.repositories;
    }
    /**
     * Update repository last used timestamp
     */
    async touchRepository(repoName) {
        await this.update(config => {
            const repo = config.repositories.find(r => r.name === repoName);
            if (repo) {
                repo.lastUsedAt = new Date().toISOString();
            }
            return config;
        });
    }
    /**
     * Update repository configuration
     */
    async updateRepository(repoName, updates) {
        await this.update(config => {
            const repo = config.repositories.find(r => r.name === repoName);
            if (repo) {
                Object.assign(repo, updates);
                repo.lastUsedAt = new Date().toISOString();
            }
            return config;
        });
    }
    /**
     * Migrate configuration to latest version
     */
    async migrate(config) {
        // Currently at version 1.0.0, no migrations needed
        // Future migrations would go here
        if (config.version !== CONFIG_VERSION) {
            // Example migration pattern:
            // if (config.version === '0.9.0') {
            //   config = migrateFrom090To100(config);
            // }
            config.version = CONFIG_VERSION;
        }
        return config;
    }
    /**
     * Check if configuration exists
     */
    async exists() {
        return await fs.pathExists(this.configPath);
    }
    /**
     * Get configuration file path
     */
    getConfigPath() {
        return this.configPath;
    }
}
//# sourceMappingURL=config.js.map