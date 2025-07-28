import { z } from 'zod';
/**
 * List all TOYBOX repositories
 */
export declare function listRepositories(): Promise<{
    success: boolean;
    repositories: Array<{
        name: string;
        localPath: string;
        remoteUrl?: string;
        publishedUrl?: string;
        isActive: boolean;
        lastUsedAt: string;
    }>;
    error?: string;
}>;
/**
 * Switch active TOYBOX repository
 */
export declare function switchRepository(params: {
    repoName: string;
}): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}>;
/**
 * Remove TOYBOX repository from configuration
 */
export declare function removeRepository(params: {
    repoName: string;
}): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}>;
/**
 * Get information about the active repository
 */
export declare function getActiveRepository(): Promise<{
    success: boolean;
    repository?: {
        name: string;
        localPath: string;
        remoteUrl?: string;
        publishedUrl?: string;
        lastUsedAt: string;
    };
    error?: string;
}>;
export declare const SwitchRepositoryParamsSchema: z.ZodObject<{
    repoName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    repoName: string;
}, {
    repoName: string;
}>;
export declare const RemoveRepositoryParamsSchema: z.ZodObject<{
    repoName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    repoName: string;
}, {
    repoName: string;
}>;
export type SwitchRepositoryParams = z.infer<typeof SwitchRepositoryParamsSchema>;
export type RemoveRepositoryParams = z.infer<typeof RemoveRepositoryParamsSchema>;
