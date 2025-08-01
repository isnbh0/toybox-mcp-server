import { execa } from 'execa';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as os from 'os';
import { log } from '../utils/logger.js';
import { DEFAULTS } from '../constants.js';
import type { GitHubAuthStatus } from '../types.js';

/**
 * GitHub CLI Integration Service
 * Handles all GitHub operations using the `gh` CLI tool
 */
export class GitHubService {
  /**
   * Get environment with proper HOME directory for gh CLI
   */
  private getGitHubEnv() {
    let home = process.env.HOME || process.env.USERPROFILE;
    
    // If no HOME is set, try to deduce it from various sources
    if (!home) {
      // Try to get from TMPDIR which usually contains username on macOS
      const tmpdir = process.env.TMPDIR;
      if (tmpdir) {
        const userMatch = tmpdir.match(/\/Users\/([^\/]+)\//);
        if (userMatch) {
          home = `/Users/${userMatch[1]}`;
        }
      }
      
      // If still no home, try from current working directory
      if (!home) {
        const cwd = process.cwd();
        const userMatch = cwd.match(/^\/Users\/([^\/]+)/);
        if (userMatch) {
          home = `/Users/${userMatch[1]}`;
        }
      }
      
      // Last resort: use Node.js os.homedir() or default
      if (!home) {
        home = process.env.USER ? `/Users/${process.env.USER}` : os.homedir();
      }
    }
    
    return {
      ...process.env,
      HOME: home
    };
  }

  /**
   * Execute gh CLI command with proper environment
   */
  private async execGh(args: string[], options: Record<string, any> = {}) {
    const env = this.getGitHubEnv();
    
    // Default to ~/.toybox directory if no cwd is specified
    const toyboxDir = join(env.HOME, '.toybox');
    
    // Ensure ~/.toybox directory exists
    if (!existsSync(toyboxDir)) {
      log.info('Creating ~/.toybox directory', { path: toyboxDir });
      mkdirSync(toyboxDir, { recursive: true });
    }
    
    const execOptions = {
      env,
      cwd: toyboxDir,  // Use ~/.toybox as working directory
      ...options
    };
    
    log.debug('Executing gh command', {
      args,
      options: execOptions,
      env: {
        HOME: env.HOME,
        PATH: (env as any).PATH?.split(':').slice(0, 3).join(':') + '...', // Show first 3 PATH entries
        GH_TOKEN: (env as any).GH_TOKEN ? '[REDACTED]' : undefined,
        GITHUB_TOKEN: (env as any).GITHUB_TOKEN ? '[REDACTED]' : undefined
      },
      cwd: execOptions.cwd
    });
    
    try {
      const result = await execa('gh', args, execOptions);
      
      log.debug('gh command succeeded', {
        args: args.join(' '),
        stdoutLength: result.stdout?.length || 0,
        stderrLength: result.stderr?.length || 0,
        exitCode: result.exitCode
      });
      
      return result;
    } catch (error) {
      log.error('gh command failed', {
        args: args.join(' '),
        error: error instanceof Error ? error.message : String(error),
        stdout: (error as any)?.stdout,
        stderr: (error as any)?.stderr,
        exitCode: (error as any)?.exitCode,
        command: (error as any)?.command,
        cwd: execOptions.cwd
      });
      
      throw error;
    }
  }

  /**
   * Check if GitHub CLI is installed and user is authenticated
   */
  async checkAuthStatus(): Promise<GitHubAuthStatus> {
    log.info('Starting GitHub authentication check');
    
    // Get the proper environment for gh CLI
    const env = this.getGitHubEnv();
    const home = env.HOME;
    const ghConfigDir = join(home, '.config', 'gh');
    const ghHostsFile = join(ghConfigDir, 'hosts.yml');
    
    log.info('Environment context for GitHub CLI', {
      originalHOME: process.env.HOME,
      originalUSERPROFILE: process.env.USERPROFILE,
      originalUSER: process.env.USER,
      TMPDIR: process.env.TMPDIR,
      PATH: process.env.PATH,
      GH_TOKEN: process.env.GH_TOKEN ? '[REDACTED]' : undefined,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN ? '[REDACTED]' : undefined,
      PWD: process.cwd(),
      NODE_ENV: process.env.NODE_ENV,
      detectedHome: home,
      ghConfigDir,
      ghConfigExists: existsSync(ghConfigDir),
      ghHostsExists: existsSync(ghHostsFile),
      fullEnvironmentHOME: env.HOME
    });
    
    try {
      // Check if gh CLI is available
      log.debug('Checking if gh CLI is available...');
      
      const versionResult = await this.execGh(['--version']);
      log.debug('gh CLI version check successful', { 
        stdout: versionResult.stdout,
        stderr: versionResult.stderr 
      });

      // Check authentication status
      log.debug('Checking GitHub authentication status...');
      const authResult = await this.execGh(['auth', 'status']);
      log.debug('gh auth status command output', { 
        stdout: authResult.stdout,
        stderr: authResult.stderr,
        exitCode: authResult.exitCode
      });
      
      // gh auth status typically outputs to stderr, so check both streams
      const outputText = authResult.stderr || authResult.stdout;
      log.debug('Combined output for parsing', { outputText });
      
      // Parse the output to get user info
      const userMatch = outputText.match(/Logged in to github\.com as ([^\s]+)/);
      const scopeMatch = outputText.match(/Token scopes: (.+)/);

      log.debug('Regex matches', { 
        userMatch: userMatch ? userMatch[0] : null,
        user: userMatch?.[1],
        scopeMatch: scopeMatch ? scopeMatch[0] : null,
        scopes: scopeMatch?.[1] 
      });
      
      const authStatus = {
        authenticated: true,
        user: userMatch?.[1],
        scopes: scopeMatch?.[1]?.split(', '),
      };
      
      log.info('GitHub authentication successful', authStatus);
      return authStatus;
      
    } catch (error) {
      // If gh command fails, either not installed or not authenticated
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('GitHub authentication check failed', { 
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stdout: (error as any)?.stdout,
        stderr: (error as any)?.stderr,
        exitCode: (error as any)?.exitCode,
        command: (error as any)?.command
      });
      
      if (errorMessage.includes('command not found') || errorMessage.includes('not found')) {
        const ghNotFoundError = 'GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/';
        log.error('GitHub CLI not found', { error: ghNotFoundError });
        throw new Error(ghNotFoundError);
      }
      
      log.warn('GitHub authentication failed, returning unauthenticated status');
      return {
        authenticated: false,
      };
    }
  }

  /**
   * Create a new repository from the TOYBOX template
   */
  async createRepository(repoName: string, templateOwner: string, templateRepo: string = DEFAULTS.TEMPLATE_REPO): Promise<string> {
    log.info('Starting repository creation', {
      repoName,
      templateOwner,
      templateRepo,
      template: `${templateOwner}/${templateRepo}`
    });

    try {
      // Log the exact command we're about to run
      const createArgs = [
        'repo', 'create', repoName,
        '--template', `${templateOwner}/${templateRepo}`,
        '--public',
        '--clone'
      ];
      
      log.info('Executing gh repo create command', {
        command: 'gh',
        args: createArgs,
        fullCommand: `gh ${createArgs.join(' ')}`
      });

      // Create repository from template
      const createResult = await this.execGh(createArgs);
      
      log.info('gh repo create command completed', {
        stdout: createResult.stdout,
        stderr: createResult.stderr,
        exitCode: createResult.exitCode
      });

      // Get the created repository URL
      log.info('Fetching created repository URL', { repoName });
      
      const viewArgs = ['repo', 'view', repoName, '--json', 'url'];
      log.info('Executing gh repo view command', {
        command: 'gh',
        args: viewArgs,
        fullCommand: `gh ${viewArgs.join(' ')}`
      });
      
      const { stdout } = await this.execGh(viewArgs);
      
      log.info('gh repo view command completed', {
        stdout,
        rawLength: stdout.length
      });
      
      const repoData = JSON.parse(stdout);
      
      log.info('Successfully created repository', {
        repoName,
        url: repoData.url
      });
      
      return repoData.url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      log.error('Repository creation failed', {
        repoName,
        templateOwner,
        templateRepo,
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stdout: (error as any)?.stdout,
        stderr: (error as any)?.stderr,
        exitCode: (error as any)?.exitCode,
        command: (error as any)?.command,
        shortMessage: (error as any)?.shortMessage,
        failed: (error as any)?.failed,
        timedOut: (error as any)?.timedOut,
        isCanceled: (error as any)?.isCanceled,
        killed: (error as any)?.killed,
        signal: (error as any)?.signal,
        originalMessage: (error as any)?.originalMessage,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new Error(`Failed to create repository: ${errorMessage}`);
    }
  }

  /**
   * Enable GitHub Pages for a repository
   */
  async enableGitHubPages(repoName: string, owner?: string): Promise<string> {
    log.info('Attempting to enable GitHub Pages', { repoName, owner });
    
    // Get owner if not provided
    if (!owner) {
      owner = await this.getCurrentUser();
    }
    
    try {
      // Enable GitHub Pages with GitHub Actions as source
      log.info('Calling GitHub API to enable Pages with workflow build type', { 
        repoName, 
        owner,
        endpoint: `repos/${owner}/${repoName}/pages` 
      });
      
      const enableResult = await this.execGh([
        'api',
        `repos/${owner}/${repoName}/pages`,
        '--method', 'POST',
        '--field', 'source[branch]=main',
        '--field', 'source[path]=/',
        '--field', 'build_type=workflow'
      ]);
      
      log.info('GitHub Pages enable API call succeeded', { 
        repoName,
        owner,
        stdout: enableResult.stdout,
        stderr: enableResult.stderr
      });

      // Get the Pages URL
      log.info('Fetching GitHub Pages URL', { repoName, owner });
      const { stdout } = await this.execGh([
        'api',
        `repos/${owner}/${repoName}/pages`,
        '--jq', '.html_url'
      ]);

      const pagesUrl = stdout.trim();
      log.info('Successfully enabled GitHub Pages', { repoName, owner, pagesUrl });
      return pagesUrl;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('GitHub Pages enable API call failed', { 
        repoName, 
        owner,
        error: errorMessage,
        stdout: (error as any)?.stdout,
        stderr: (error as any)?.stderr,
        exitCode: (error as any)?.exitCode
      });
      
      // Pages might already be enabled, try to get the URL
      log.info('Attempting to fetch existing GitHub Pages URL', { repoName, owner });
      try {
        const { stdout } = await this.execGh([
          'api',
          `repos/${owner}/${repoName}/pages`,
          '--jq', '.html_url'
        ]);
        const pagesUrl = stdout.trim();
        log.info('Found existing GitHub Pages URL', { repoName, owner, pagesUrl });
        return pagesUrl;
      } catch (getUrlError) {
        log.warn('Could not fetch GitHub Pages URL immediately - Pages may still be setting up', { 
          repoName, 
          owner,
          error: getUrlError instanceof Error ? getUrlError.message : String(getUrlError)
        });
        
        // Return a constructed URL as fallback - GitHub Pages will be available here once it's ready
        const fallbackUrl = `https://${owner}.github.io/${repoName}/`;
        log.info('Using constructed GitHub Pages URL as fallback', { 
          repoName, 
          owner, 
          fallbackUrl,
          note: 'Pages will be available at this URL once GitHub finishes setup'
        });
        return fallbackUrl;
      }
    }
  }

  /**
   * Get the current user's GitHub username
   */
  async getCurrentUser(): Promise<string> {
    try {
      const { stdout } = await this.execGh(['api', 'user', '--jq', '.login']);
      return stdout.trim();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get current user: ${errorMessage}`);
    }
  }

  /**
   * Check if a repository exists
   */
  async repositoryExists(repoName: string): Promise<boolean> {
    try {
      await this.execGh(['repo', 'view', repoName]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(repoName: string, owner?: string): Promise<{ url: string; cloneUrl: string; pagesUrl?: string }> {
    try {
      const { stdout } = await this.execGh([
        'repo', 'view', repoName,
        '--json', 'url,sshUrl'
      ]);

      const repoData = JSON.parse(stdout);

      // Try to get Pages URL
      let pagesUrl: string | undefined;
      try {
        // Get owner if not provided
        if (!owner) {
          owner = await this.getCurrentUser();
        }
        
        const pagesResult = await this.execGh([
          'api',
          `repos/${owner}/${repoName}/pages`,
          '--jq', '.html_url'
        ]);
        pagesUrl = pagesResult.stdout.trim();
      } catch {
        // Pages not enabled yet
      }

      return {
        url: repoData.url,
        cloneUrl: repoData.sshUrl || repoData.url, // Fallback to url if sshUrl not available
        pagesUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get repository info: ${errorMessage}`);
    }
  }

  /**
   * Trigger a workflow dispatch to rebuild the site
   */
  async triggerWorkflow(repoName: string, workflowFile: string = 'deploy.yml', owner?: string): Promise<void> {
    try {
      // Get owner if not provided
      if (!owner) {
        owner = await this.getCurrentUser();
      }
      
      await this.execGh([
        'workflow', 'run', workflowFile,
        '--repo', `${owner}/${repoName}`
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to trigger workflow: ${errorMessage}`);
    }
  }

  /**
   * Create a new GitHub repository (without template)
   */
  async createEmptyRepository(repoName: string, isPrivate: boolean = false): Promise<string> {
    try {
      // Create empty repository
      const visibility = isPrivate ? '--private' : '--public';
      await this.execGh([
        'repo', 'create', repoName,
        visibility
      ]);

      // Get the created repository URL
      const { stdout } = await this.execGh(['repo', 'view', repoName, '--json', 'url']);
      const repoData = JSON.parse(stdout);
      
      return repoData.url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create repository: ${errorMessage}`);
    }
  }

  /**
   * Get the clone URL for a repository
   */
  async getCloneUrl(repoName: string, useSSH: boolean = true): Promise<string> {
    try {
      const { stdout } = await this.execGh([
        'repo', 'view', repoName,
        '--json', useSSH ? 'sshUrl' : 'url'
      ]);
      
      const repoData = JSON.parse(stdout);
      if (useSSH) {
        return repoData.sshUrl;
      } else {
        // Convert HTTPS URL to clone URL format
        const repoUrl = repoData.url;
        return repoUrl + '.git';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get clone URL: ${errorMessage}`);
    }
  }
}
