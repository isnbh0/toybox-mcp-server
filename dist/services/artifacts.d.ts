import type { ArtifactMetadata, ToyboxConfig } from '../types.js';
/**
 * Artifact Management Service
 * Handles artifact code generation, file operations, and discovery
 */
export declare class ArtifactService {
    private repoPath;
    constructor(repoPath: string);
    /**
     * Generate a unique artifact ID from slug
     */
    generateArtifactId(slug: string): string;
    /**
     * Generate artifact file content with proper TypeScript structure
     */
    generateArtifactFile(code: string, metadata: ArtifactMetadata): string;
    /**
     * Save artifact to file system
     */
    saveArtifact(artifactId: string, content: string): Promise<string>;
    /**
     * Update existing artifact
     */
    updateArtifact(artifactId: string, content: string): Promise<string>;
    /**
     * Delete an artifact
     */
    deleteArtifact(artifactId: string): Promise<void>;
    /**
     * List all artifacts in the repository
     */
    listArtifacts(): Promise<Array<{
        id: string;
        metadata: ArtifactMetadata;
        filePath: string;
    }>>;
    /**
     * Extract metadata from an artifact file
     */
    extractMetadata(filePath: string): Promise<ArtifactMetadata>;
    /**
     * Update TOYBOX configuration
     */
    updateConfig(config: Partial<ToyboxConfig>): Promise<void>;
    /**
     * Read current TOYBOX configuration
     */
    readConfig(): Promise<ToyboxConfig>;
    /**
     * Generate artifact URL for a given artifact ID
     */
    generateArtifactUrl(artifactId: string, baseUrl: string): string;
    /**
     * Validate artifact code for security and compatibility
     */
    validateArtifactCode(code: string): {
        valid: boolean;
        issues: string[];
    };
}
