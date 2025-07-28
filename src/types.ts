import { z } from 'zod';

// Artifact metadata schema matching the template repository
export const ArtifactMetadataSchema = z.object({
  title: z.string(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase kebab-case (e.g., "my-component", "todo-app")'
  }),
  description: z.string().optional(),
  type: z.enum(['react', 'svg', 'mermaid']),
  tags: z.array(z.string()).default([]),
  folder: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ArtifactMetadata = z.infer<typeof ArtifactMetadataSchema>;

// TOYBOX configuration schema
export const ToyboxConfigSchema = z.object({
  title: z.string().default('My TOYBOX'),
  description: z.string().default('A collection of my creative artifacts'),
  theme: z.enum(['auto', 'light', 'dark']).default('auto'),
  layout: z.enum(['grid', 'list']).default('grid'),
  showFooter: z.boolean().default(true),
});

export type ToyboxConfig = z.infer<typeof ToyboxConfigSchema>;

// MCP function parameters
export const InitializeToyboxParamsSchema = z.object({
  repoName: z.string().default('toybox'),
  templateOwner: z.string().default('isnbh0'),
  templateRepo: z.string().default('toybox'),
  config: ToyboxConfigSchema.optional(),
  debug: z.boolean().optional().default(process.env.TOYBOX_DEBUG === 'true'),
  localTemplatePath: z.string().optional(),
  createRemote: z.boolean().optional().default(true),
  isPrivate: z.boolean().optional().default(false),
});

export type InitializeToyboxParams = z.infer<typeof InitializeToyboxParamsSchema>;

export const PublishArtifactParamsSchema = z.object({
  code: z.string(),
  metadata: ArtifactMetadataSchema,
});

export type PublishArtifactParams = z.infer<typeof PublishArtifactParamsSchema>;

export const SetupRemoteParamsSchema = z.object({
  repoName: z.string(),
  isPrivate: z.boolean().default(false),
  enablePages: z.boolean().default(true),
});

export type SetupRemoteParams = z.infer<typeof SetupRemoteParamsSchema>;

// Internal types
export interface GitHubAuthStatus {
  authenticated: boolean;
  user?: string;
  scopes?: string[];
}

export interface ToyboxRepository {
  name: string;
  localPath: string;
  remoteUrl: string;
  publishedUrl: string;
}

export interface PublishResult {
  success: boolean;
  artifactId: string;
  artifactUrl: string;
  message?: string;
  error?: string;
}

export interface InitResult {
  success: boolean;
  repository: ToyboxRepository;
  message?: string;
  error?: string;
}

export interface SetupRemoteResult {
  success: boolean;
  repositoryUrl?: string;
  cloneUrl?: string;
  pagesUrl?: string;
  message?: string;
  error?: string;
}