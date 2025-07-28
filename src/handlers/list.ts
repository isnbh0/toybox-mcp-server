import { ArtifactService } from '../services/artifacts.js';
import { ConfigService } from '../services/config.js';
import { log } from '../utils/logger.js';
import type { ArtifactMetadata } from '../types.js';

export interface ListArtifactsResult {
  success: boolean;
  artifacts: Array<{
    id: string;
    metadata: ArtifactMetadata;
    url: string;
    standaloneUrl: string;
  }>;
  galleryUrl: string;
  totalCount: number;
  message?: string;
  error?: string;
}

/**
 * List all published artifacts in TOYBOX
 */
export async function listArtifacts(): Promise<ListArtifactsResult> {
  const configService = new ConfigService();
  
  log.info('Starting artifact listing');
  
  try {
    // Step 1: Get active TOYBOX repository from config
    log.debug('Looking for active TOYBOX repository...');
    log.info('Looking for active TOYBOX repository');
    const activeRepo = await configService.getActiveRepository();
    
    if (!activeRepo) {
      return {
        success: false,
        artifacts: [],
        galleryUrl: '',
        totalCount: 0,
        error: 'No active TOYBOX repository found. Please run initialize_toybox first or set an active repository.',
      };
    }

    const localPath = activeRepo.localPath;
    log.info('Using TOYBOX at path', { localPath });
    
    // Update last used timestamp
    await configService.touchRepository(activeRepo.name);

    // Step 2: Initialize services
    const artifactService = new ArtifactService(localPath);

    // Step 3: List all artifacts
    log.info('Scanning for artifacts');
    const artifactList = await artifactService.listArtifacts();

    // Step 4: Generate URLs for each artifact
    const baseUrl = activeRepo.publishedUrl || `https://example.github.io/${activeRepo.name}`;
    
    const artifactsWithUrls = artifactList.map(artifact => ({
      id: artifact.id,
      metadata: artifact.metadata,
      url: artifactService.generateArtifactUrl(artifact.id, baseUrl),
      standaloneUrl: `${baseUrl}/standalone/${artifact.id}`,
    }));

    // Step 5: Group by folders if any
    const groupedArtifacts = groupArtifactsByFolder(artifactsWithUrls);

    return {
      success: true,
      artifacts: artifactsWithUrls,
      galleryUrl: baseUrl,
      totalCount: artifactsWithUrls.length,
      message: formatArtifactsList(groupedArtifacts, baseUrl),
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      artifacts: [],
      galleryUrl: '',
      totalCount: 0,
      error: `Failed to list artifacts: ${errorMessage}`,
    };
  }
}


/**
 * Group artifacts by folder
 */
function groupArtifactsByFolder(artifacts: Array<{
  id: string;
  metadata: ArtifactMetadata;
  url: string;
  standaloneUrl: string;
}>) {
  const grouped: Record<string, typeof artifacts> = {};
  
  for (const artifact of artifacts) {
    const folder = artifact.metadata.folder || 'General';
    if (!grouped[folder]) {
      grouped[folder] = [];
    }
    grouped[folder].push(artifact);
  }
  
  return grouped;
}

/**
 * Format artifacts list for display
 */
function formatArtifactsList(
  groupedArtifacts: Record<string, Array<{
    id: string;
    metadata: ArtifactMetadata;
    url: string;
    standaloneUrl: string;
  }>>,
  baseUrl: string
): string {
  const totalCount = Object.values(groupedArtifacts).reduce((sum, group) => sum + group.length, 0);
  
  if (totalCount === 0) {
    return `📦 Your TOYBOX is empty\\n\\nGallery: ${baseUrl}\\n\\nPublish your first artifact using the publish_artifact command!`;
  }

  let output = `📦 Your TOYBOX contains ${totalCount} artifact${totalCount === 1 ? '' : 's'}\\n\\n`;
  output += `🌐 Gallery: ${baseUrl}\\n\\n`;

  const folders = Object.keys(groupedArtifacts).sort();
  
  for (const folder of folders) {
    const artifacts = groupedArtifacts[folder];
    
    if (folders.length > 1) {
      output += `📁 ${folder}\\n`;
    }
    
    for (const artifact of artifacts) {
      const { metadata, url } = artifact;
      const ageInDays = Math.floor((Date.now() - new Date(metadata.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      const ageText = ageInDays === 0 ? 'today' : 
                     ageInDays === 1 ? 'yesterday' : 
                     `${ageInDays} days ago`;
      
      output += `  • ${metadata.title} (${metadata.type})\\n`;
      output += `    ${url}\\n`;
      if (metadata.description) {
        output += `    ${metadata.description}\\n`;
      }
      if (metadata.tags && metadata.tags.length > 0) {
        output += `    Tags: ${metadata.tags.join(', ')}\\n`;
      }
      output += `    Updated ${ageText}\\n\\n`;
    }
  }

  return output.trim();
}