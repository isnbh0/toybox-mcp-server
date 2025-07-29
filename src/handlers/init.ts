import * as path from 'path';
import * as os from 'os';
import { GitHubService } from '../services/github.js';
import { GitService } from '../services/git.js';
import { ArtifactService } from '../services/artifacts.js';
import { ConfigService } from '../services/config.js';
import { log } from '../utils/logger.js';
import type { InitializeToyboxParams, InitResult, ToyboxRepository } from '../types.js';

/**
 * Initialize a new TOYBOX repository with GitHub Pages publishing
 */
export async function initializeToybox(params: InitializeToyboxParams): Promise<InitResult> {
  const { repoName, templateOwner, templateRepo, config, debug, createRemote, isPrivate } = params;
  const githubService = new GitHubService();
  const configService = new ConfigService();

  log.info('Starting TOYBOX initialization', { 
    repoName,
    templateOwner, 
    templateRepo, 
    debug, 
    createRemote, 
    isPrivate 
  });

  try {
    const needsGitHubRemote = createRemote;
    let currentUser: string = 'debug-user';
    
    // Step 1: Check GitHub CLI authentication (if needed for remote)
    if (needsGitHubRemote) {
      log.debug('Checking GitHub CLI authentication...');
      const authStatus = await githubService.checkAuthStatus();

      if (!authStatus.authenticated) {
        log.error('GitHub CLI authentication failed');
        return {
          success: false,
          repository: {} as ToyboxRepository,
          error: 'Not authenticated with GitHub CLI. Please run: gh auth login',
        };
      }

      log.info('GitHub authentication successful', { user: authStatus.user });
      
      // Get the actual current user from GitHub API
      log.debug('Attempting to get current GitHub user...');
      try {
        currentUser = await githubService.getCurrentUser();
        log.info('Got current GitHub user', { currentUser });
      } catch (error) {
        log.error('Failed to get current user, falling back to auth status user', {
          error: error instanceof Error ? error.message : String(error),
          authStatusUser: authStatus.user 
        });
        currentUser = authStatus.user || 'unknown';
      }
    } else {
      log.info('Skipping GitHub integration per user request');
    }

    // Step 2: Check if repository already exists (if creating remote)
    if (needsGitHubRemote) {
      const repoExists = await githubService.repositoryExists(repoName);
      if (repoExists) {
        return {
          success: false,
          repository: {} as ToyboxRepository,
          error: `Repository '${repoName}' already exists. Choose a different name or use an existing repository.`,
        };
      }
    }

    // Step 3: Set up local repository path in ~/.toybox
    const toyboxDir = path.join(os.homedir(), '.toybox');
    const localPath = path.join(toyboxDir, repoName);
    const gitService = new GitService(localPath);
    
    let repoUrl: string;
    let pagesUrl: string = '';
    let cloneUrl: string = '';
    
    if (!needsGitHubRemote) {
      // Clone from GitHub template without creating a new repository
      log.info('Cloning from TOYBOX template', { templateOwner, templateRepo });
      const templateUrl = `https://github.com/${templateOwner}/${templateRepo}.git`;
      await gitService.cloneRepository(templateUrl, localPath);
      
      // Remove origin remote since we'll be setting up our own later
      try {
        await gitService.removeRemote('origin');
      } catch (error) {
        // Ignore if remote doesn't exist
      }
      
      // Re-initialize to start fresh
      await gitService.initRepository();
      
      // Set URLs for local mode
      repoUrl = `file://${localPath}`;
      pagesUrl = debug ? `http://localhost:5173/` : '';
      
    } else {
      // Full GitHub integration mode: Create from GitHub template
      log.info('Creating repository from TOYBOX template', { 
        templateOwner, 
        templateRepo,
        repoName,
        currentUser,
        templatePath: `${templateOwner}/${templateRepo}`
      });
      
      try {
        repoUrl = await githubService.createRepository(repoName, templateOwner, templateRepo);
        log.info('Repository creation succeeded', { repoUrl });
      } catch (createError) {
        log.error('Repository creation failed in init handler', {
          error: createError instanceof Error ? createError.message : String(createError),
          stack: createError instanceof Error ? createError.stack : undefined,
          repoName,
          templateOwner,
          templateRepo
        });
        throw createError;
      }
      
      // Get repository information
      log.info('Getting repository information', { repoName });
      const repoInfo = await githubService.getRepositoryInfo(repoName);
      log.info('Repository info retrieved', { repoInfo });
      cloneUrl = repoInfo.cloneUrl;
      
      // Clone repository locally
      // gh repo create --clone will have cloned it to ~/.toybox/repoName
      log.info('Checking for cloned repository', { localPath });
      
      // The repository should already be cloned by gh repo create --clone
      if (!await gitService.repositoryExists()) {
        // If for some reason it wasn't cloned, clone it manually
        log.info('Repository not found, cloning manually', { 
          cloneUrl: repoInfo.cloneUrl, 
          localPath 
        });
        await gitService.cloneRepository(repoInfo.cloneUrl, localPath);
      } else {
        log.info('Repository already exists at target location');
      }
      
      // Get current user for GitHub integration mode
      currentUser = await githubService.getCurrentUser();
    }

    // Step 4: Configure git user
    log.info('Configuring git user', { currentUser, email: `${currentUser}@users.noreply.github.com` });
    await gitService.configureUser(currentUser, `${currentUser}@users.noreply.github.com`);

    // Step 5: Set up GitHub remote if needed and not already done
    log.info('Checking GitHub remote setup conditions', { 
      needsGitHubRemote, 
      repoUrl, 
      shouldCreateRemote: needsGitHubRemote && !repoUrl 
    });
    
    if (needsGitHubRemote && !repoUrl) {
      log.info('Setting up GitHub remote repository');
      log.info('Creating GitHub remote repository...');
      
      try {
        // Create empty GitHub repository
        log.info('Creating empty GitHub repository...', { repoName, isPrivate });
        repoUrl = await githubService.createEmptyRepository(repoName, isPrivate);
        log.info('GitHub repository created successfully', { repoUrl });
        
        cloneUrl = await githubService.getCloneUrl(repoName, true); // Use SSH by default
        log.info('Got clone URL', { cloneUrl });
        
        // Add remote to local repository
        log.info('Adding remote to local repository...', { cloneUrl });
        await gitService.addRemote('origin', cloneUrl);
        
        // Add all files and make initial commit on main branch
        await gitService.addFiles(['.']);
        
        // Create main branch as the first branch
        log.info('Creating main branch...');
        await gitService.createBranch('main');
        
        // Make initial commit
        log.info('Making initial commit...');
        const commitHash = await gitService.commit('feat: Initial TOYBOX setup');
        log.info('Initial commit created successfully', { commitHash });
        
        // Push to remote with --set-upstream
        log.info('Pushing to GitHub remote...');
        await gitService.push('origin', 'main', true);
        log.info('Successfully pushed to GitHub remote');
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error('Failed to set up GitHub remote', { 
          error: errorMessage,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          repoName,
          isPrivate
        });
        log.error('Failed to set up GitHub remote', { error });
        
        // Return failure instead of silently falling back to local mode
        return {
          success: false,
          repository: {} as ToyboxRepository,
          error: `Failed to set up GitHub remote repository: ${errorMessage}. Local repository was created at ${localPath} but could not be connected to GitHub.`,
        };
      }
    }

    // Step 6: Update TOYBOX configuration if provided
    if (config) {
      log.info('Updating TOYBOX configuration');
      const artifactService = new ArtifactService(localPath);
      await artifactService.updateConfig(config);

      // Commit the configuration changes
      await gitService.addFiles(['TOYBOX_CONFIG.json']);
      await gitService.commit('feat: Update TOYBOX configuration');
      
      // Push if we have a remote
      if (needsGitHubRemote && repoUrl && repoUrl !== `file://${localPath}`) {
        await gitService.push();
      }
    }

    // Step 7: Enable GitHub Pages (if we have a remote repository)
    if (needsGitHubRemote && repoUrl && repoUrl !== `file://${localPath}`) {
      log.info('Enabling GitHub Pages with GitHub Actions');
      log.info('Attempting to enable GitHub Pages for repository', { repoName, currentUser });
      
      try {
        pagesUrl = await githubService.enableGitHubPages(repoName, currentUser);
        log.info('GitHub Pages enabled successfully', { repoName, pagesUrl });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error('Failed to enable GitHub Pages', { 
          repoName, 
          error: errorMessage,
          currentUser 
        });
        
        // Fallback to constructed URL
        pagesUrl = `https://${currentUser}.github.io/${repoName}/`;
        log.warn('Using fallback GitHub Pages URL', { 
          repoName, 
          fallbackUrl: pagesUrl,
          note: 'GitHub Pages will be enabled automatically by the deploy.yml workflow' 
        });
        
        log.warn('GitHub Pages setup failed, using fallback approach', { 
          errorMessage, 
          note: 'GitHub Pages will be enabled automatically by the deploy.yml workflow' 
        });
      }
    }

    const repository: ToyboxRepository = {
      name: repoName,
      localPath,
      remoteUrl: repoUrl,
      publishedUrl: pagesUrl,
    };

    // Save repository to config
    await configService.upsertRepository({
      name: repoName,
      localPath,
      remoteUrl: repoUrl,
      publishedUrl: pagesUrl,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      isActive: true,
    });
    
    // Set as active repository
    await configService.setActiveRepository(repoName);

    let message: string;
    
    if (debug && needsGitHubRemote && repoUrl && repoUrl !== `file://${localPath}`) {
      message = `✅ TOYBOX initialized successfully in debug mode with GitHub integration!\\n\\n` +
                `Repository: ${repoUrl}\\n` +
                `Local path: ${localPath}\\n` +
                `Development URL: ${pagesUrl}\\n` +
                `Published URL: ${pagesUrl.replace('http://localhost:5173/', `https://${currentUser}.github.io/${repoName}/`)}\\n\\n` +
                `Your TOYBOX is ready for local development and GitHub publishing!`;
    } else if (debug) {
      message = `✅ TOYBOX initialized successfully in debug mode!\\n\\n` +
                `Local path: ${localPath}\\n` +
                `Development URL: ${pagesUrl}\\n\\n` +
                `Your TOYBOX is ready for local development! Run 'npm run dev' in the repository to start.`;
    } else if (needsGitHubRemote && repoUrl && repoUrl !== `file://${localPath}`) {
      message = `✅ TOYBOX initialized successfully with GitHub integration!\\n\\n` +
                `Repository: ${repoUrl}\\n` +
                `Local path: ${localPath}\\n` +
                `Published URL: ${pagesUrl}\\n\\n` +
                `Your TOYBOX is ready! You can now publish artifacts using the publish_artifact command.`;
    } else if (needsGitHubRemote) {
      message = `✅ TOYBOX initialized locally!\\n\\n` +
                `Local path: ${localPath}\\n\\n` +
                `Note: GitHub remote setup failed but you can set it up later using the setup_remote command.\\n` +
                `Your TOYBOX is ready for local development and artifact publishing.`;
    } else {
      message = `✅ TOYBOX initialized locally!\\n\\n` +
                `Local path: ${localPath}\\n\\n` +
                `Your TOYBOX is ready for local development! Use the setup_remote command to add GitHub integration later if needed.`;
    }

    log.info('TOYBOX initialization completed successfully', { 
      repoName, 
      localPath: repository.localPath,
      remoteUrl: repository.remoteUrl,
      publishedUrl: repository.publishedUrl 
    });

    return {
      success: true,
      repository,
      message,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('TOYBOX initialization failed', { 
      error: errorMessage, 
      repoName, 
      debug, 
      createRemote 
    });
    
    return {
      success: false,
      repository: {} as ToyboxRepository,
      error: `Failed to initialize TOYBOX: ${errorMessage}`,
    };
  }
}
