import { ToyboxConfig, ToyboxRepoConfig } from '../types/config.js';
/**
 * Service for managing TOYBOX configuration
 * Implements safe file operations with atomic writes and locking
 */
export declare class ConfigService {
    private configPath;
    private lockRetries;
    private lockStale;
    constructor(configPath?: string);
    /**
     * Read configuration from disk
     * Creates default config if file doesn't exist
     */
    read(): Promise<ToyboxConfig>;
    /**
     * Write configuration to disk with atomic operation
     * Uses write-rename pattern to prevent corruption
     */
    write(config: ToyboxConfig): Promise<void>;
    /**
     * Update configuration with locking to prevent concurrent modifications
     */
    update(updater: (config: ToyboxConfig) => ToyboxConfig | Promise<ToyboxConfig>): Promise<ToyboxConfig>;
    /**
     * Get active repository configuration
     */
    getActiveRepository(): Promise<ToyboxRepoConfig | null>;
    /**
     * Set active repository
     */
    setActiveRepository(repoName: string): Promise<void>;
    /**
     * Add or update repository configuration
     */
    upsertRepository(repo: ToyboxRepoConfig): Promise<void>;
    /**
     * Remove repository configuration
     */
    removeRepository(repoName: string): Promise<void>;
    /**
     * Get all repositories
     */
    getRepositories(): Promise<ToyboxRepoConfig[]>;
    /**
     * Update repository last used timestamp
     */
    touchRepository(repoName: string): Promise<void>;
    /**
     * Update repository configuration
     */
    updateRepository(repoName: string, updates: Partial<ToyboxRepoConfig>): Promise<void>;
    /**
     * Migrate configuration to latest version
     */
    private migrate;
    /**
     * Check if configuration exists
     */
    exists(): Promise<boolean>;
    /**
     * Get configuration file path
     */
    getConfigPath(): string;
}
