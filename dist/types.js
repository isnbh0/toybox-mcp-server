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
// TOYBOX configuration schema
export const ToyboxConfigSchema = z.object({
    title: z.string().default('My TOYBOX'),
    description: z.string().default('A collection of my creative artifacts'),
    theme: z.enum(['auto', 'light', 'dark']).default('auto'),
    layout: z.enum(['grid', 'list']).default('grid'),
    showFooter: z.boolean().default(true),
});
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
export const PublishArtifactParamsSchema = z.object({
    code: z.string(),
    metadata: ArtifactMetadataSchema,
});
export const SetupRemoteParamsSchema = z.object({
    repoName: z.string(),
    isPrivate: z.boolean().default(false),
    enablePages: z.boolean().default(true),
});
//# sourceMappingURL=types.js.map