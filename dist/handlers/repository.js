import { ConfigService } from '../services/config.js';
import { GitService } from '../services/git.js';
import { z } from 'zod';
/**
 * List all TOYBOX repositories
 */
export async function listRepositories() {
    const configService = new ConfigService();
    try {
        const repositories = await configService.getRepositories();
        const config = await configService.read();
        return {
            success: true,
            repositories: repositories.map(repo => ({
                name: repo.name,
                localPath: repo.localPath,
                remoteUrl: repo.remoteUrl,
                publishedUrl: repo.publishedUrl,
                isActive: repo.isActive || repo.name === config.activeRepository,
                lastUsedAt: repo.lastUsedAt,
            })),
        };
    }
    catch (error) {
        return {
            success: false,
            repositories: [],
            error: `Failed to list repositories: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
/**
 * Switch active TOYBOX repository
 */
export async function switchRepository(params) {
    const configService = new ConfigService();
    try {
        // Check if repository exists in config
        const repositories = await configService.getRepositories();
        const repo = repositories.find(r => r.name === params.repoName);
        if (!repo) {
            return {
                success: false,
                error: `Repository '${params.repoName}' not found in configuration`,
            };
        }
        // Verify the repository still exists on disk
        const gitService = new GitService(repo.localPath);
        if (!await gitService.repositoryExists()) {
            return {
                success: false,
                error: `Repository path '${repo.localPath}' no longer exists`,
            };
        }
        // Set as active
        await configService.setActiveRepository(params.repoName);
        return {
            success: true,
            message: `Switched to repository '${params.repoName}' at ${repo.localPath}`,
        };
    }
    catch (error) {
        return {
            success: false,
            error: `Failed to switch repository: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
/**
 * Remove TOYBOX repository from configuration
 */
export async function removeRepository(params) {
    const configService = new ConfigService();
    try {
        // Check if repository exists
        const repositories = await configService.getRepositories();
        const repo = repositories.find(r => r.name === params.repoName);
        if (!repo) {
            return {
                success: false,
                error: `Repository '${params.repoName}' not found in configuration`,
            };
        }
        // Remove from config
        await configService.removeRepository(params.repoName);
        return {
            success: true,
            message: `Removed repository '${params.repoName}' from configuration. Note: The repository files at '${repo.localPath}' were not deleted.`,
        };
    }
    catch (error) {
        return {
            success: false,
            error: `Failed to remove repository: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
/**
 * Get information about the active repository
 */
export async function getActiveRepository() {
    const configService = new ConfigService();
    try {
        const activeRepo = await configService.getActiveRepository();
        if (!activeRepo) {
            return {
                success: false,
                error: 'No active repository set. Use switch_repository to set one.',
            };
        }
        return {
            success: true,
            repository: {
                name: activeRepo.name,
                localPath: activeRepo.localPath,
                remoteUrl: activeRepo.remoteUrl,
                publishedUrl: activeRepo.publishedUrl,
                lastUsedAt: activeRepo.lastUsedAt,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: `Failed to get active repository: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
// Schema definitions for MCP tool parameters
export const SwitchRepositoryParamsSchema = z.object({
    repoName: z.string(),
});
export const RemoveRepositoryParamsSchema = z.object({
    repoName: z.string(),
});
//# sourceMappingURL=repository.js.map