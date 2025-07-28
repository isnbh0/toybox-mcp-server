import * as path from 'path';
import { GitService } from '../services/git.js';
import { ArtifactService } from '../services/artifacts.js';
import { ConfigService } from '../services/config.js';
import { log } from '../utils/logger.js';
import type { PublishArtifactParams, PublishResult } from '../types.js';

/**
 * Publish a new artifact to TOYBOX
 */
export async function publishArtifact(params: PublishArtifactParams): Promise<PublishResult> {
  const { code, metadata } = params;
  const configService = new ConfigService();

  log.info('Starting artifact publication', { title: metadata.title, type: metadata.type });

  try {
    // Step 1: Get active TOYBOX repository from config
    log.debug('Looking for active TOYBOX repository...');
    log.info('Looking for active TOYBOX repository');
    const activeRepo = await configService.getActiveRepository();
    
    if (!activeRepo) {
      log.error('No active TOYBOX repository found');
      return {
        success: false,
        artifactId: '',
        artifactUrl: '',
        error: 'No active TOYBOX repository found. Please run initialize_toybox first or set an active repository.',
      };
    }

    const localPath = activeRepo.localPath;
    log.info('Using TOYBOX repository', { localPath, repoName: activeRepo.name });
    log.info('Using TOYBOX at path', { localPath });
    
    // Update last used timestamp
    await configService.touchRepository(activeRepo.name);

    // Step 2: Initialize services
    const gitService = new GitService(localPath);
    const artifactService = new ArtifactService(localPath);

    // Step 3: Validate artifact code
    log.debug('Validating artifact code...');
    log.info('Validating artifact code');
    const validation = artifactService.validateArtifactCode(code);
    if (!validation.valid) {
      log.error('Code validation failed', { issues: validation.issues });
      return {
        success: false,
        artifactId: '',
        artifactUrl: '',
        error: `Code validation failed: ${validation.issues.join(', ')}`,
      };
    }

    // Step 4: Generate artifact ID and check for conflicts
    const artifactId = artifactService.generateArtifactId(metadata.slug);
    log.info('Generated artifact ID', { artifactId, slug: metadata.slug, title: metadata.title });
    log.info('Generated artifact ID', { artifactId });

    // Step 5: Generate artifact file content
    const artifactContent = artifactService.generateArtifactFile(code, metadata);

    // Step 6: Pull latest changes to avoid conflicts
    log.debug('Pulling latest changes...');
    log.info('Pulling latest changes');
    try {
      await gitService.pull();
      log.debug('Successfully pulled latest changes');
    } catch (error) {
      log.warn('Could not pull changes, proceeding with local state', { error: error instanceof Error ? error.message : String(error) });
      log.warn('Could not pull changes, proceeding with local state');
    }

    // Step 7: Save artifact to filesystem
    log.debug('Saving artifact...');
    log.info('Saving artifact');
    let filePath: string;
    try {
      filePath = await artifactService.saveArtifact(artifactId, artifactContent);
      log.info('Artifact saved successfully', { filePath });
    } catch (error) {
      // If artifact exists, try updating it instead
      if (error instanceof Error && error.message.includes('already exists')) {
        log.info('Artifact exists, updating...', { artifactId });
        log.info('Artifact exists, updating');
        filePath = await artifactService.updateArtifact(artifactId, artifactContent);
        log.info('Artifact updated successfully', { filePath });
      } else {
        throw error;
      }
    }

    // Step 8: Stage changes
    log.debug('Staging changes...');
    log.info('Staging changes');
    const relativePath = path.relative(localPath, filePath);
    await gitService.addFiles([relativePath]);
    log.debug('Files staged', { stagedFiles: [relativePath] });

    // Step 9: Check if there are changes to commit
    const hasChanges = await gitService.hasUncommittedChanges();
    if (!hasChanges) {
      log.warn('No changes detected, artifact may already be up to date');
      return {
        success: false,
        artifactId,
        artifactUrl: '',
        error: 'No changes detected. Artifact may already be up to date.',
      };
    }

    // Step 10: Commit changes
    const commitMessages = [
      `feat: Add/update artifact "${metadata.title}"`,
      `- Type: ${metadata.type}
- Tags: ${metadata.tags?.join(', ') || 'none'}${metadata.description ? `\n- Description: ${metadata.description}` : ''}
- Created: ${metadata.createdAt}
- Updated: ${metadata.updatedAt}`
    ];

    log.debug('Committing changes...', { commitMessages });
    log.info('Committing changes');
    await gitService.commit(commitMessages);
    log.info('Changes committed successfully');

    // Step 11: Push to GitHub
    log.debug('Pushing to GitHub...');
    log.info('Pushing to GitHub');
    await gitService.push();
    log.info('Changes pushed to GitHub successfully');

    // Step 12: Get published URL
    const baseUrl = activeRepo.publishedUrl || `https://example.github.io/${activeRepo.name}`;
    const artifactUrl = artifactService.generateArtifactUrl(artifactId, baseUrl);
    
    log.info('Artifact published successfully', { 
      artifactId, 
      artifactUrl, 
      baseUrl,
      title: metadata.title 
    });

    return {
      success: true,
      artifactId,
      artifactUrl,
      message: `✅ Artifact published successfully!\n\n` +
               `Title: ${metadata.title}\n` +
               `ID: ${artifactId}\n` +
               `URL: ${artifactUrl}\n` +
               `Gallery: ${baseUrl}\n\n` +
               `Your artifact is now live! It may take a few minutes for GitHub Pages to update.`,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Failed to publish artifact', { error: errorMessage, title: metadata.title });
    
    return {
      success: false,
      artifactId: '',
      artifactUrl: '',
      error: `Failed to publish artifact: ${errorMessage}`,
    };
  }
}

