import { z } from 'zod';
/**
 * Schema for individual TOYBOX repository configuration
 */
export declare const ToyboxRepoConfigSchema: z.ZodObject<{
    name: z.ZodString;
    localPath: z.ZodString;
    remoteUrl: z.ZodOptional<z.ZodString>;
    publishedUrl: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    lastUsedAt: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    name: string;
    localPath: string;
    lastUsedAt: string;
    isActive: boolean;
    metadata?: Record<string, unknown> | undefined;
    remoteUrl?: string | undefined;
    publishedUrl?: string | undefined;
}, {
    createdAt: string;
    name: string;
    localPath: string;
    lastUsedAt: string;
    metadata?: Record<string, unknown> | undefined;
    remoteUrl?: string | undefined;
    publishedUrl?: string | undefined;
    isActive?: boolean | undefined;
}>;
export type ToyboxRepoConfig = z.infer<typeof ToyboxRepoConfigSchema>;
/**
 * Main configuration schema for .toybox.json
 */
export declare const ToyboxConfigSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodString>;
    repositories: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        localPath: z.ZodString;
        remoteUrl: z.ZodOptional<z.ZodString>;
        publishedUrl: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        lastUsedAt: z.ZodString;
        isActive: z.ZodDefault<z.ZodBoolean>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        name: string;
        localPath: string;
        lastUsedAt: string;
        isActive: boolean;
        metadata?: Record<string, unknown> | undefined;
        remoteUrl?: string | undefined;
        publishedUrl?: string | undefined;
    }, {
        createdAt: string;
        name: string;
        localPath: string;
        lastUsedAt: string;
        metadata?: Record<string, unknown> | undefined;
        remoteUrl?: string | undefined;
        publishedUrl?: string | undefined;
        isActive?: boolean | undefined;
    }>, "many">>;
    activeRepository: z.ZodOptional<z.ZodString>;
    debug: z.ZodDefault<z.ZodBoolean>;
    localTemplatePath: z.ZodOptional<z.ZodString>;
    lastUpdated: z.ZodString;
    preferences: z.ZodDefault<z.ZodObject<{
        defaultRepoName: z.ZodDefault<z.ZodString>;
        autoCommit: z.ZodDefault<z.ZodBoolean>;
        commitMessage: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        defaultRepoName: string;
        autoCommit: boolean;
        commitMessage: string;
    }, {
        defaultRepoName?: string | undefined;
        autoCommit?: boolean | undefined;
        commitMessage?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    debug: boolean;
    version: string;
    repositories: {
        createdAt: string;
        name: string;
        localPath: string;
        lastUsedAt: string;
        isActive: boolean;
        metadata?: Record<string, unknown> | undefined;
        remoteUrl?: string | undefined;
        publishedUrl?: string | undefined;
    }[];
    lastUpdated: string;
    preferences: {
        defaultRepoName: string;
        autoCommit: boolean;
        commitMessage: string;
    };
    localTemplatePath?: string | undefined;
    activeRepository?: string | undefined;
}, {
    lastUpdated: string;
    debug?: boolean | undefined;
    localTemplatePath?: string | undefined;
    version?: string | undefined;
    repositories?: {
        createdAt: string;
        name: string;
        localPath: string;
        lastUsedAt: string;
        metadata?: Record<string, unknown> | undefined;
        remoteUrl?: string | undefined;
        publishedUrl?: string | undefined;
        isActive?: boolean | undefined;
    }[] | undefined;
    activeRepository?: string | undefined;
    preferences?: {
        defaultRepoName?: string | undefined;
        autoCommit?: boolean | undefined;
        commitMessage?: string | undefined;
    } | undefined;
}>;
export type ToyboxConfig = z.infer<typeof ToyboxConfigSchema>;
/**
 * Default configuration factory
 */
export declare function createDefaultConfig(): ToyboxConfig;
/**
 * Config file constants
 */
export declare const CONFIG_FILE_NAME = ".toybox.json";
export declare const CONFIG_VERSION = "1.0.0";
