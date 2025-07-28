import fs from 'fs-extra';
import { readFile, writeFile } from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../utils/logger.js';
/**
 * Artifact Management Service
 * Handles artifact code generation, file operations, and discovery
 */
export class ArtifactService {
    repoPath;
    constructor(repoPath) {
        this.repoPath = repoPath;
    }
    /**
     * Generate a unique artifact ID from slug
     */
    generateArtifactId(slug) {
        // Generate a short UUID suffix (first 8 characters)
        const uuidSuffix = uuidv4().split('-')[0];
        // Combine slug with UUID suffix
        return `${slug}-${uuidSuffix}`;
    }
    /**
     * Generate artifact file content with proper TypeScript structure
     */
    generateArtifactFile(code, metadata) {
        const { title, description, type, tags, folder, createdAt, updatedAt } = metadata;
        // Clean the code - remove any existing export statements for metadata
        let cleanCode = code.replace(/export\s+const\s+metadata\s*:.*?;/gs, '').trim();
        // Ensure the component is exported as default
        if (!cleanCode.includes('export default')) {
            // Try to find the main component and add export default
            const componentMatch = cleanCode.match(/(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/);
            if (componentMatch) {
                cleanCode += `\n\nexport default ${componentMatch[1]};`;
            }
        }
        // Generate the complete artifact file
        return `${cleanCode}

export const metadata = {
  title: ${JSON.stringify(title)},
  ${description ? `description: ${JSON.stringify(description)},` : ''}
  type: ${JSON.stringify(type)},
  tags: ${JSON.stringify(tags)},
  ${folder ? `folder: ${JSON.stringify(folder)},` : ''}
  createdAt: ${JSON.stringify(createdAt)},
  updatedAt: ${JSON.stringify(updatedAt)},
} as const;
`;
    }
    /**
     * Save artifact to file system
     */
    async saveArtifact(artifactId, content) {
        const artifactsDir = path.join(this.repoPath, 'src', 'artifacts');
        const filePath = path.join(artifactsDir, `${artifactId}.tsx`);
        // Ensure artifacts directory exists
        await fs.ensureDir(artifactsDir);
        // Check if file already exists
        if (await fs.pathExists(filePath)) {
            throw new Error(`Artifact ${artifactId} already exists. Use a different title or update the existing artifact.`);
        }
        // Write the file
        await writeFile(filePath, content, 'utf8');
        return filePath;
    }
    /**
     * Update existing artifact
     */
    async updateArtifact(artifactId, content) {
        const artifactsDir = path.join(this.repoPath, 'src', 'artifacts');
        const filePath = path.join(artifactsDir, `${artifactId}.tsx`);
        // Check if file exists
        if (!await fs.pathExists(filePath)) {
            throw new Error(`Artifact ${artifactId} does not exist. Use publish to create a new artifact.`);
        }
        // Write the updated content
        await writeFile(filePath, content, 'utf8');
        return filePath;
    }
    /**
     * Delete an artifact
     */
    async deleteArtifact(artifactId) {
        const artifactsDir = path.join(this.repoPath, 'src', 'artifacts');
        const filePath = path.join(artifactsDir, `${artifactId}.tsx`);
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
        }
    }
    /**
     * List all artifacts in the repository
     */
    async listArtifacts() {
        const artifactsDir = path.join(this.repoPath, 'src', 'artifacts');
        if (!await fs.pathExists(artifactsDir)) {
            return [];
        }
        const artifactFiles = await glob('*.tsx', { cwd: artifactsDir });
        const artifacts = [];
        for (const file of artifactFiles) {
            const filePath = path.join(artifactsDir, file);
            const artifactId = path.basename(file, '.tsx');
            // Skip .gitkeep and other non-artifact files
            if (artifactId.startsWith('.') || artifactId === 'index') {
                continue;
            }
            try {
                const metadata = await this.extractMetadata(filePath);
                artifacts.push({
                    id: artifactId,
                    metadata,
                    filePath,
                });
            }
            catch (error) {
                log.error('Failed to read metadata from file', { file, error });
                // Continue with other files
            }
        }
        return artifacts.sort((a, b) => new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime());
    }
    /**
     * Extract metadata from an artifact file
     */
    async extractMetadata(filePath) {
        const content = await readFile(filePath, 'utf8');
        // Extract metadata using regex (simple approach)
        const metadataMatch = content.match(/export\s+const\s+metadata\s*=\s*({[^}]+})/s);
        if (!metadataMatch) {
            throw new Error('No metadata found in artifact file');
        }
        try {
            // Parse the metadata object
            const metadataStr = metadataMatch[1]
                .replace(/as\s+const\s*;?\s*$/, '') // Remove 'as const'
                .replace(/,\s*$/, ''); // Remove trailing comma
            const metadata = eval(`(${metadataStr})`);
            // Validate required fields
            if (!metadata.title || !metadata.type || !metadata.createdAt || !metadata.updatedAt) {
                throw new Error('Missing required metadata fields');
            }
            return metadata;
        }
        catch (error) {
            throw new Error(`Failed to parse metadata: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Update TOYBOX configuration
     */
    async updateConfig(config) {
        const configPath = path.join(this.repoPath, 'TOYBOX_CONFIG.json');
        let existingConfig = {
            title: 'My TOYBOX',
            description: 'A collection of my creative artifacts',
            theme: 'auto',
            layout: 'grid',
            showFooter: true,
        };
        // Read existing config if it exists
        if (await fs.pathExists(configPath)) {
            try {
                const configContent = await readFile(configPath, 'utf8');
                existingConfig = { ...existingConfig, ...JSON.parse(configContent) };
            }
            catch (error) {
                log.warn('Failed to read existing config, using defaults');
            }
        }
        // Merge with new config
        const updatedConfig = { ...existingConfig, ...config };
        // Write updated config
        await writeFile(configPath, JSON.stringify(updatedConfig, null, 2), 'utf8');
    }
    /**
     * Read current TOYBOX configuration
     */
    async readConfig() {
        const configPath = path.join(this.repoPath, 'TOYBOX_CONFIG.json');
        const defaultConfig = {
            title: 'My TOYBOX',
            description: 'A collection of my creative artifacts',
            theme: 'auto',
            layout: 'grid',
            showFooter: true,
        };
        if (!await fs.pathExists(configPath)) {
            return defaultConfig;
        }
        try {
            const configContent = await readFile(configPath, 'utf8');
            return { ...defaultConfig, ...JSON.parse(configContent) };
        }
        catch (error) {
            log.warn('Failed to read config, using defaults');
            return defaultConfig;
        }
    }
    /**
     * Generate artifact URL for a given artifact ID
     */
    generateArtifactUrl(artifactId, baseUrl) {
        // Remove trailing slash from baseUrl
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        return `${cleanBaseUrl}/a/${artifactId}`;
    }
    /**
     * Validate artifact code for security and compatibility
     */
    validateArtifactCode(code) {
        const issues = [];
        // Check for potentially dangerous patterns
        const dangerousPatterns = [
            /eval\s*\(/gi,
            /Function\s*\(/gi,
            /document\.write/gi,
            /innerHTML\s*=/gi,
            /outerHTML\s*=/gi,
            /dangerouslySetInnerHTML/gi,
        ];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(code)) {
                issues.push(`Potentially unsafe pattern detected: ${pattern.source}`);
            }
        }
        // Check for required React import (if using JSX)
        if (code.includes('<') && code.includes('>') && !code.includes('import React')) {
            issues.push('React components should import React or use React namespace');
        }
        // Check for export default
        if (!code.includes('export default')) {
            issues.push('Artifact should export a default component');
        }
        return {
            valid: issues.length === 0,
            issues,
        };
    }
}
//# sourceMappingURL=artifacts.js.map