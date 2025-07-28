import { Artifact } from './types';
import { ToyboxConfig } from './store';

// Import both direct .tsx files and index.tsx files inside directories
const directArtifactsImports: Record<string, { 
  default: React.ComponentType<any>;
  metadata?: ArtifactMetadata;
}> = import.meta.glob('../artifacts/*.tsx', { eager: true });

// Import index.tsx files from subdirectories
const subdirArtifactsImports: Record<string, { 
  default: React.ComponentType<any>;
  metadata?: ArtifactMetadata;
}> = import.meta.glob('../artifacts/*/index.tsx', { eager: true });

// Combine both import maps
const artifactsImports = {
  ...directArtifactsImports,
  ...subdirArtifactsImports
};

/**
 * Metadata structure for static artifacts
 */
export interface ArtifactMetadata {
  title: string;
  description?: string;
  type: 'react' | 'svg' | 'mermaid';
  tags: string[];
  folder?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Extract artifact ID from file path
 * Handles both direct files (example.tsx) and subdirectory files (example/index.tsx)
 */
function getArtifactIdFromPath(path: string): string {
  // For subdirectory artifacts (example/index.tsx), extract "example"
  if (path.includes('/index.tsx')) {
    const match = path.match(/\.\.\/artifacts\/(.+)\/index\.tsx/);
    return match ? match[1] : path;
  }
  
  // For direct artifacts (example.tsx), extract "example"
  return path.replace('../artifacts/', '').replace('.tsx', '');
}

/**
 * Load all available artifacts from the static files
 */
export function loadArtifacts(): Artifact[] {
  const artifacts: Artifact[] = [];

  for (const path in artifactsImports) {
    const importedModule = artifactsImports[path];
    const artifactId = getArtifactIdFromPath(path);

    // Create metadata (either from the module or a placeholder)
    let metadata: ArtifactMetadata;
    
    if (!importedModule.metadata) {
      console.warn(`Artifact ${artifactId} is missing metadata, using placeholder metadata.`);
      metadata = {
        title: artifactId,
        description: 'Auto-generated placeholder description',
        type: 'react',
        tags: ['auto-generated'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      metadata = importedModule.metadata;
    }

    artifacts.push({
      id: artifactId,
      title: metadata.title,
      description: metadata.description || '',
      type: metadata.type,
      tags: metadata.tags || [],
      folder: metadata.folder,
      code: '', // The code is now the component itself, not a string
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    });
  }

  return artifacts;
}

/**
 * Get a specific artifact by its name
 */
export function getArtifact(name: string): { 
  artifact: Artifact | undefined; 
  component: React.ComponentType<any> | undefined;
} {
  const artifacts = loadArtifacts();
  const artifact = artifacts.find(a => a.id === name);
  let component;

  // First try to find as a direct artifact
  const directPath = `../artifacts/${name}.tsx`;
  if (directArtifactsImports[directPath]) {
    component = directArtifactsImports[directPath].default;
  } else {
    // If not found, try as a subdirectory artifact
    const subdirPath = `../artifacts/${name}/index.tsx`;
    component = subdirArtifactsImports[subdirPath]?.default;
  }

  return { artifact, component };
}

/**
 * Get all unique folders from artifacts
 */
export function getAllFolders(): string[] {
  const artifacts = loadArtifacts();
  const foldersSet = new Set<string>();

  artifacts.forEach(artifact => {
    if (artifact.folder) {
      foldersSet.add(artifact.folder);
    }
  });

  return Array.from(foldersSet).sort();
}

/**
 * Get all unique tags from artifacts
 */
export function getAllTags(): string[] {
  const artifacts = loadArtifacts();
  const tagsSet = new Set<string>();

  artifacts.forEach(artifact => {
    artifact.tags.forEach(tag => tagsSet.add(tag));
  });

  return Array.from(tagsSet).sort();
}

/**
 * Load TOYBOX configuration
 */
export async function loadToyboxConfig(): Promise<ToyboxConfig> {
  try {
    const response = await fetch('/TOYBOX_CONFIG.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Could not load TOYBOX_CONFIG.json, using defaults');
  }
  
  // Return default config
  return {
    title: 'My TOYBOX',
    description: 'A collection of my Claude-generated artifacts',
    theme: 'auto',
    layout: 'grid',
    showFooter: true
  };
}
