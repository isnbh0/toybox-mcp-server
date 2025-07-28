/**
 * Local Git Operations Service
 * Handles local git repository management and file operations
 */
export declare class GitService {
    private repoPath;
    constructor(repoPath?: string);
    /**
     * Get the default repository path in user's home directory
     */
    private getDefaultRepoPath;
    /**
     * Set the repository path
     */
    setRepoPath(repoPath: string): void;
    /**
     * Check if the current directory is a git repository
     */
    isGitRepository(): Promise<boolean>;
    /**
     * Clone a repository to the local path
     */
    cloneRepository(repoUrl: string, targetPath?: string): Promise<string>;
    /**
     * Initialize a new git repository
     */
    initRepository(): Promise<void>;
    /**
     * Add files to staging area
     */
    addFiles(patterns?: string[]): Promise<void>;
    /**
     * Commit changes with a message
     */
    commit(message: string | string[]): Promise<string>;
    /**
     * Push changes to remote repository
     */
    push(remote?: string, branch?: string, setUpstream?: boolean): Promise<void>;
    /**
     * Set up remote origin
     */
    addRemote(name: string, url: string): Promise<void>;
    /**
     * Remove a remote
     */
    removeRemote(name: string): Promise<void>;
    /**
     * Get current git status
     */
    getStatus(): Promise<string>;
    /**
     * Check if there are uncommitted changes
     */
    hasUncommittedChanges(): Promise<boolean>;
    /**
     * Get the current branch name
     */
    getCurrentBranch(): Promise<string>;
    /**
     * Create and checkout a new branch
     */
    createBranch(branchName: string): Promise<void>;
    /**
     * Checkout an existing branch
     */
    checkoutBranch(branchName: string): Promise<void>;
    /**
     * Pull latest changes from remote
     */
    pull(remote?: string, branch?: string): Promise<void>;
    /**
     * Get the repository root directory
     */
    getRepositoryRoot(): Promise<string>;
    /**
     * Configure git user for commits
     */
    configureUser(name: string, email: string): Promise<void>;
    /**
     * Execute a git command in the repository directory
     */
    private execGit;
    /**
     * Get the current repository path
     */
    getRepoPath(): string;
    /**
     * Check if repository directory exists
     */
    repositoryExists(): Promise<boolean>;
}
