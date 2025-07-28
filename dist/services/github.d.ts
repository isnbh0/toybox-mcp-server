import type { GitHubAuthStatus } from '../types.js';
/**
 * GitHub CLI Integration Service
 * Handles all GitHub operations using the `gh` CLI tool
 */
export declare class GitHubService {
    /**
     * Get environment with proper HOME directory for gh CLI
     */
    private getGitHubEnv;
    /**
     * Execute gh CLI command with proper environment
     */
    private execGh;
    /**
     * Check if GitHub CLI is installed and user is authenticated
     */
    checkAuthStatus(): Promise<GitHubAuthStatus>;
    /**
     * Create a new repository from the TOYBOX template
     */
    createRepository(repoName: string, templateOwner: string, templateRepo?: string): Promise<string>;
    /**
     * Enable GitHub Pages for a repository
     */
    enableGitHubPages(repoName: string, owner?: string): Promise<string>;
    /**
     * Get the current user's GitHub username
     */
    getCurrentUser(): Promise<string>;
    /**
     * Check if a repository exists
     */
    repositoryExists(repoName: string): Promise<boolean>;
    /**
     * Get repository information
     */
    getRepositoryInfo(repoName: string, owner?: string): Promise<{
        url: string;
        cloneUrl: string;
        pagesUrl?: string;
    }>;
    /**
     * Trigger a workflow dispatch to rebuild the site
     */
    triggerWorkflow(repoName: string, workflowFile?: string, owner?: string): Promise<void>;
    /**
     * Create a new GitHub repository (without template)
     */
    createEmptyRepository(repoName: string, isPrivate?: boolean): Promise<string>;
    /**
     * Get the clone URL for a repository
     */
    getCloneUrl(repoName: string, useSSH?: boolean): Promise<string>;
}
