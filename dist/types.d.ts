import { z } from 'zod';
export declare const ArtifactMetadataSchema: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["react", "svg", "mermaid"]>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    folder: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    slug: string;
    type: "react" | "svg" | "mermaid";
    tags: string[];
    createdAt: string;
    updatedAt: string;
    description?: string | undefined;
    folder?: string | undefined;
}, {
    title: string;
    slug: string;
    type: "react" | "svg" | "mermaid";
    createdAt: string;
    updatedAt: string;
    description?: string | undefined;
    tags?: string[] | undefined;
    folder?: string | undefined;
}>;
export type ArtifactMetadata = z.infer<typeof ArtifactMetadataSchema>;
export declare const ToyboxConfigSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    description: z.ZodDefault<z.ZodString>;
    theme: z.ZodDefault<z.ZodEnum<["auto", "light", "dark"]>>;
    layout: z.ZodDefault<z.ZodEnum<["grid", "list"]>>;
    showFooter: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    theme: "auto" | "light" | "dark";
    layout: "grid" | "list";
    showFooter: boolean;
}, {
    title?: string | undefined;
    description?: string | undefined;
    theme?: "auto" | "light" | "dark" | undefined;
    layout?: "grid" | "list" | undefined;
    showFooter?: boolean | undefined;
}>;
export type ToyboxConfig = z.infer<typeof ToyboxConfigSchema>;
export declare const InitializeToyboxParamsSchema: z.ZodObject<{
    repoName: z.ZodDefault<z.ZodString>;
    templateOwner: z.ZodDefault<z.ZodString>;
    templateRepo: z.ZodDefault<z.ZodString>;
    config: z.ZodOptional<z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        description: z.ZodDefault<z.ZodString>;
        theme: z.ZodDefault<z.ZodEnum<["auto", "light", "dark"]>>;
        layout: z.ZodDefault<z.ZodEnum<["grid", "list"]>>;
        showFooter: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        description: string;
        theme: "auto" | "light" | "dark";
        layout: "grid" | "list";
        showFooter: boolean;
    }, {
        title?: string | undefined;
        description?: string | undefined;
        theme?: "auto" | "light" | "dark" | undefined;
        layout?: "grid" | "list" | undefined;
        showFooter?: boolean | undefined;
    }>>;
    debug: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    localTemplatePath: z.ZodOptional<z.ZodString>;
    createRemote: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isPrivate: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    debug: boolean;
    repoName: string;
    templateOwner: string;
    templateRepo: string;
    createRemote: boolean;
    isPrivate: boolean;
    config?: {
        title: string;
        description: string;
        theme: "auto" | "light" | "dark";
        layout: "grid" | "list";
        showFooter: boolean;
    } | undefined;
    localTemplatePath?: string | undefined;
}, {
    debug?: boolean | undefined;
    repoName?: string | undefined;
    templateOwner?: string | undefined;
    templateRepo?: string | undefined;
    config?: {
        title?: string | undefined;
        description?: string | undefined;
        theme?: "auto" | "light" | "dark" | undefined;
        layout?: "grid" | "list" | undefined;
        showFooter?: boolean | undefined;
    } | undefined;
    localTemplatePath?: string | undefined;
    createRemote?: boolean | undefined;
    isPrivate?: boolean | undefined;
}>;
export type InitializeToyboxParams = z.infer<typeof InitializeToyboxParamsSchema>;
export declare const PublishArtifactParamsSchema: z.ZodObject<{
    code: z.ZodString;
    metadata: z.ZodObject<{
        title: z.ZodString;
        slug: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["react", "svg", "mermaid"]>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        folder: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        title: string;
        slug: string;
        type: "react" | "svg" | "mermaid";
        tags: string[];
        createdAt: string;
        updatedAt: string;
        description?: string | undefined;
        folder?: string | undefined;
    }, {
        title: string;
        slug: string;
        type: "react" | "svg" | "mermaid";
        createdAt: string;
        updatedAt: string;
        description?: string | undefined;
        tags?: string[] | undefined;
        folder?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    code: string;
    metadata: {
        title: string;
        slug: string;
        type: "react" | "svg" | "mermaid";
        tags: string[];
        createdAt: string;
        updatedAt: string;
        description?: string | undefined;
        folder?: string | undefined;
    };
}, {
    code: string;
    metadata: {
        title: string;
        slug: string;
        type: "react" | "svg" | "mermaid";
        createdAt: string;
        updatedAt: string;
        description?: string | undefined;
        tags?: string[] | undefined;
        folder?: string | undefined;
    };
}>;
export type PublishArtifactParams = z.infer<typeof PublishArtifactParamsSchema>;
export declare const SetupRemoteParamsSchema: z.ZodObject<{
    repoName: z.ZodString;
    isPrivate: z.ZodDefault<z.ZodBoolean>;
    enablePages: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    repoName: string;
    isPrivate: boolean;
    enablePages: boolean;
}, {
    repoName: string;
    isPrivate?: boolean | undefined;
    enablePages?: boolean | undefined;
}>;
export type SetupRemoteParams = z.infer<typeof SetupRemoteParamsSchema>;
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
