import { GitHubService } from '../services/github.js';
import { GitService } from '../services/git.js';
import { ConfigService } from '../services/config.js';
import { log } from '../utils/logger.js';
import type { SetupRemoteParams, SetupRemoteResult } from '../types.js';

/**
 * Set up a GitHub remote repository for an existing local TOYBOX
 */
export async function setupRemote(params: SetupRemoteParams): Promise<SetupRemoteResult> {
  const { repoName, isPrivate = false, enablePages = true } = params;
  const githubService = new GitHubService();
  const configService = new ConfigService();

  try {
    // Step 1: Check GitHub CLI authentication
    log.info('Checking GitHub CLI authentication');
    const authStatus = await githubService.checkAuthStatus();
    
    if (!authStatus.authenticated) {
      return {
        success: false,
        error: 'Not authenticated with GitHub CLI. Please run: gh auth login',
      };
    }

    log.info('Authenticated as user', { user: authStatus.user });
    const currentUser = authStatus.user || 'unknown';

    // Step 2: Check if repository already exists
    const repoExists = await githubService.repositoryExists(repoName);
    if (repoExists) {
      return {
        success: false,
        error: `Repository '${repoName}' already exists. Choose a different name or use the existing repository.`,
      };
    }

    // Step 3: Get active repository path
    const activeRepo = await configService.getActiveRepository();
    if (!activeRepo) {
      return {
        success: false,
        error: 'No active TOYBOX repository found. Please initialize a TOYBOX first.',
      };
    }

    const gitService = new GitService(activeRepo.localPath);

    // Step 4: Ensure local repository exists and is initialized
    if (!await gitService.repositoryExists()) {
      return {
        success: false,
        error: 'Local repository not found. Please ensure you have an initialized TOYBOX.',
      };
    }

    // Step 5: Create GitHub repository
    log.info('Creating GitHub repository', { repoName });
    const repoUrl = await githubService.createEmptyRepository(repoName, isPrivate);
    
    // Step 6: Get clone URL for the repository
    const cloneUrl = await githubService.getCloneUrl(repoName, true); // Use SSH by default

    // Step 7: Add remote to local repository
    log.info('Adding remote to local repository');
    await gitService.addRemote('origin', cloneUrl);

    // Step 8: Push existing commits to remote
    log.info('Pushing local commits to remote');
    await gitService.push('origin', 'main', true); // Push with --set-upstream

    // Step 9: Enable GitHub Pages if requested
    let pagesUrl = '';
    if (enablePages) {
      log.info('Enabling GitHub Pages');
      try {
        pagesUrl = await githubService.enableGitHubPages(repoName);
      } catch (error) {
        // Pages might need time to activate
        pagesUrl = `https://${currentUser}.github.io/${repoName}/`;
        log.info('GitHub Pages setup initiated, may take a few minutes to activate');
      }

      // Step 10: Trigger initial deployment
      log.info('Triggering initial deployment');
      try {
        await githubService.triggerWorkflow(repoName);
      } catch (error) {
        log.warn('Could not trigger workflow, but Pages should auto-deploy');
      }
    }

    // Step 11: Update repository configuration
    await configService.updateRepository(activeRepo.name, {
      remoteUrl: repoUrl,
      publishedUrl: pagesUrl,
      lastUsedAt: new Date().toISOString(),
    });

    return {
      success: true,
      repositoryUrl: repoUrl,
      cloneUrl,
      pagesUrl: pagesUrl || undefined,
      message: `✅ GitHub remote repository setup successfully!\n\n` +
        `Repository: ${repoUrl}\n` +
        `Local path: ${activeRepo.localPath}\n` +
        `Clone URL: ${cloneUrl}\n` +
        (pagesUrl ? `Published URL: ${pagesUrl}\n\n` : '\n') +
        `Your local TOYBOX is now connected to GitHub! You can continue publishing artifacts.`,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      error: `Failed to setup GitHub remote: ${errorMessage}`,
    };
  }
}