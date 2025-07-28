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
export declare function listArtifacts(): Promise<ListArtifactsResult>;
