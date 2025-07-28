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
export declare function updateConfig(configUpdates: Partial<ToyboxConfig>): Promise<UpdateConfigResult>;
/**
 * Get current TOYBOX configuration
 */
export declare function getConfig(): Promise<UpdateConfigResult>;
