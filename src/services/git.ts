import { execa } from 'execa';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

/**
 * Local Git Operations Service
 * Handles local git repository management and file operations
 */
export class GitService {
  private repoPath: string;

  constructor(repoPath?: string) {
    this.repoPath = repoPath || this.getDefaultRepoPath();
  }

  /**
   * Get the default repository path in user's home directory
   */
  private getDefaultRepoPath(): string {
    return path.join(os.homedir(), 'toybox');
  }

  /**
   * Set the repository path
   */
  setRepoPath(repoPath: string): void {
    this.repoPath = repoPath;
  }

  /**
   * Check if the current directory is a git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await this.execGit(['rev-parse', '--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clone a repository to the local path
   */
  async cloneRepository(repoUrl: string, targetPath?: string): Promise<string> {
    const clonePath = targetPath || this.repoPath;
    
    try {
      // Ensure parent directory exists
      await fs.ensureDir(path.dirname(clonePath));
      
      // Remove existing directory if it exists
      if (await fs.pathExists(clonePath)) {
        await fs.remove(clonePath);
      }

      await execa('git', ['clone', repoUrl, clonePath]);
      this.repoPath = clonePath;
      
      return clonePath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to clone repository: ${errorMessage}`);
    }
  }

  /**
   * Initialize a new git repository
   */
  async initRepository(): Promise<void> {
    try {
      await fs.ensureDir(this.repoPath);
      await this.execGit(['init']);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize repository: ${errorMessage}`);
    }
  }

  /**
   * Add files to staging area
   */
  async addFiles(patterns: string[] = ['.']): Promise<void> {
    try {
      await this.execGit(['add', ...patterns]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to add files: ${errorMessage}`);
    }
  }

  /**
   * Commit changes with a message
   */
  async commit(message: string | string[]): Promise<string> {
    try {
      const commitArgs = ['commit'];
      
      if (Array.isArray(message)) {
        // Use multiple -m flags for multi-line messages
        message.forEach(line => {
          commitArgs.push('-m', line);
        });
      } else {
        commitArgs.push('-m', message);
      }
      
      const { stdout } = await this.execGit(commitArgs);

      // Get the actual commit hash using git rev-parse
      const { stdout: hash } = await this.execGit(['rev-parse', 'HEAD']);
      return hash.trim().substring(0, 7);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to commit: ${errorMessage}`);
    }
  }

  /**
   * Push changes to remote repository
   */
  async push(remote: string = 'origin', branch: string = 'main', setUpstream: boolean = false): Promise<void> {
    try {
      const args = setUpstream 
        ? ['push', '--set-upstream', remote, branch]
        : ['push', remote, branch];
      
      await this.execGit(args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to push: ${errorMessage}`);
    }
  }

  /**
   * Set up remote origin
   */
  async addRemote(name: string, url: string): Promise<void> {
    try {
      // Remove existing remote if it exists
      try {
        await this.execGit(['remote', 'remove', name]);
      } catch {
        // Remote doesn't exist, continue
      }
      
      await this.execGit(['remote', 'add', name, url]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to add remote: ${errorMessage}`);
    }
  }

  /**
   * Remove a remote
   */
  async removeRemote(name: string): Promise<void> {
    try {
      await this.execGit(['remote', 'remove', name]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to remove remote: ${errorMessage}`);
    }
  }

  /**
   * Get current git status
   */
  async getStatus(): Promise<string> {
    try {
      const { stdout } = await this.execGit(['status', '--porcelain']);
      return stdout;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get status: ${errorMessage}`);
    }
  }

  /**
   * Check if there are uncommitted changes
   */
  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.getStatus();
    return status.trim().length > 0;
  }

  /**
   * Get the current branch name
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await this.execGit(['branch', '--show-current']);
      return stdout.trim();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get current branch: ${errorMessage}`);
    }
  }

  /**
   * Create and checkout a new branch
   */
  async createBranch(branchName: string): Promise<void> {
    try {
      await this.execGit(['checkout', '-b', branchName]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create branch: ${errorMessage}`);
    }
  }

  /**
   * Checkout an existing branch
   */
  async checkoutBranch(branchName: string): Promise<void> {
    try {
      await this.execGit(['checkout', branchName]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to checkout branch: ${errorMessage}`);
    }
  }

  /**
   * Pull latest changes from remote
   */
  async pull(remote: string = 'origin', branch?: string): Promise<void> {
    try {
      const currentBranch = branch || await this.getCurrentBranch();
      await this.execGit(['pull', remote, currentBranch]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to pull: ${errorMessage}`);
    }
  }

  /**
   * Get the repository root directory
   */
  async getRepositoryRoot(): Promise<string> {
    try {
      const { stdout } = await this.execGit(['rev-parse', '--show-toplevel']);
      return stdout.trim();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get repository root: ${errorMessage}`);
    }
  }

  /**
   * Configure git user for commits
   */
  async configureUser(name: string, email: string): Promise<void> {
    try {
      await this.execGit(['config', 'user.name', name]);
      await this.execGit(['config', 'user.email', email]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to configure user: ${errorMessage}`);
    }
  }

  /**
   * Execute a git command in the repository directory
   */
  private async execGit(args: string[]): Promise<{ stdout: string; stderr: string }> {
    return await execa('git', args, {
      cwd: this.repoPath,
      stdio: 'pipe',
    });
  }

  /**
   * Get the current repository path
   */
  getRepoPath(): string {
    return this.repoPath;
  }

  /**
   * Check if repository directory exists
   */
  async repositoryExists(): Promise<boolean> {
    return await fs.pathExists(this.repoPath);
  }
}
