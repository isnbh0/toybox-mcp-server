import { z } from 'zod';

/**
 * Schema for individual TOYBOX repository configuration
 */
export const ToyboxRepoConfigSchema = z.object({
  name: z.string(),
  localPath: z.string(),
  remoteUrl: z.string().optional(),
  publishedUrl: z.string().optional(),
  createdAt: z.string(), // ISO date string
  lastUsedAt: z.string(), // ISO date string
  isActive: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(), // For future extensibility
});

export type ToyboxRepoConfig = z.infer<typeof ToyboxRepoConfigSchema>;

/**
 * Main configuration schema for .toybox.json
 */
export const ToyboxConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  repositories: z.array(ToyboxRepoConfigSchema).default([]),
  activeRepository: z.string().optional(), // Repository name
  debug: z.boolean().default(false),
  localTemplatePath: z.string().optional(),
  lastUpdated: z.string(), // ISO date string
  preferences: z.object({
    defaultRepoName: z.string().default('toybox'),
    autoCommit: z.boolean().default(true),
    commitMessage: z.string().default('feat: Add new artifact via TOYBOX'),
  }).default({}),
});

export type ToyboxConfig = z.infer<typeof ToyboxConfigSchema>;

/**
 * Default configuration factory
 */
export function createDefaultConfig(): ToyboxConfig {
  return {
    version: '1.0.0',
    repositories: [],
    debug: process.env.TOYBOX_DEBUG === 'true',
    localTemplatePath: process.env.TOYBOX_LOCAL_TEMPLATE_PATH,
    lastUpdated: new Date().toISOString(),
    preferences: {
      defaultRepoName: 'toybox',
      autoCommit: true,
      commitMessage: 'feat: Add new artifact via TOYBOX',
    },
  };
}

/**
 * Config file constants
 */
export const CONFIG_FILE_NAME = '.toybox.json';
export const CONFIG_VERSION = '1.0.0';