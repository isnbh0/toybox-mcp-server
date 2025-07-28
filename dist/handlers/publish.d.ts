import type { PublishArtifactParams, PublishResult } from '../types.js';
/**
 * Publish a new artifact to TOYBOX
 */
export declare function publishArtifact(params: PublishArtifactParams): Promise<PublishResult>;
