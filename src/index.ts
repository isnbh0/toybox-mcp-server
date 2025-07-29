#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { log } from './utils/logger.js';
import { DEFAULTS, DESCRIPTIONS } from './constants.js';
import { initializeToybox } from './handlers/init.js';
import { publishArtifact } from './handlers/publish.js';
import { listArtifacts } from './handlers/list.js';
import { updateConfig } from './handlers/config.js';
import { setupRemote } from './handlers/setup-remote.js';
import { 
  listRepositories, 
  switchRepository, 
  removeRepository, 
  getActiveRepository,
  SwitchRepositoryParamsSchema,
  RemoveRepositoryParamsSchema,
} from './handlers/repository.js';
import {
  InitializeToyboxParamsSchema,
  PublishArtifactParamsSchema,
  SetupRemoteParamsSchema,
} from './types.js';

class ToyboxMCPServer {
  private server: Server;

  constructor() {
    log.info('Initializing TOYBOX MCP Server', { 
      logFile: log.getLogFilePath(),
      version: DEFAULTS.VERSION,
      debugMode: log.isEnabled()
    });
    
    this.server = new Server(
      {
        name: DEFAULTS.SERVER_NAME,
        version: DEFAULTS.VERSION,
      },
      {
        capabilities: {
          tools: {
            listChanged: false
          },
          resources: {
            listChanged: false
          },
          prompts: {
            listChanged: false
          }
        }
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupPromptHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'initialize_toybox',
          description: 'Initialize a complete TOYBOX with local repository, GitHub remote, and Pages setup',
          inputSchema: {
            type: 'object',
            properties: {
              repoName: {
                type: 'string',
                description: DESCRIPTIONS.REPO_NAME,
                default: DEFAULTS.USER_REPO_NAME,
              },
              templateOwner: {
                type: 'string',
                description: DESCRIPTIONS.TEMPLATE_OWNER,
                default: DEFAULTS.TEMPLATE_OWNER,
              },
              templateRepo: {
                type: 'string',
                description: DESCRIPTIONS.TEMPLATE_REPO,
                default: DEFAULTS.TEMPLATE_REPO,
              },
              config: {
                type: 'object',
                description: 'TOYBOX configuration options',
                properties: {
                  title: { type: 'string', default: 'My TOYBOX' },
                  description: { type: 'string', default: 'A collection of my creative artifacts' },
                  theme: { type: 'string', enum: ['auto', 'light', 'dark'], default: 'auto' },
                  layout: { type: 'string', enum: ['grid', 'list'], default: 'grid' },
                  showFooter: { type: 'boolean', default: true },
                },
              },
              debug: {
                type: 'boolean',
                description: 'Enable debug mode to use local template (can still create GitHub remote)',
                default: false,
              },
              localTemplatePath: {
                type: 'string',
                description: 'Path to local template directory (optional, defaults to built-in template)',
              },
              createRemote: {
                type: 'boolean',
                description: 'Create a GitHub repository and set up remote (default: true)',
                default: true,
              },
              isPrivate: {
                type: 'boolean',
                description: 'Create GitHub repository as private (default: false)',
                default: false,
              },
            },
            required: [],
          },
        },
        {
          name: 'publish_artifact',
          description: 'Publish a new artifact to your TOYBOX. Artifacts are uniquely identified by a slug-based ID with UUID suffix.',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'The React component code for the artifact (do not include React import - uses new JSX transform)',
              },
              metadata: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Display title for the artifact (can include any characters, emojis, etc.)' },
                  slug: { 
                    type: 'string', 
                    description: 'URL-friendly identifier in lowercase kebab-case (e.g., "my-component", "todo-app"). Only lowercase letters, numbers, and hyphens allowed.',
                  },
                  description: { type: 'string', description: 'Optional description' },
                  type: { type: 'string', enum: ['react', 'svg', 'mermaid'], description: 'Artifact type' },
                  tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags' },
                  folder: { type: 'string', description: 'Optional folder grouping' },
                  createdAt: { type: 'string', description: 'ISO date string' },
                  updatedAt: { type: 'string', description: 'ISO date string' },
                },
                required: ['title', 'slug', 'type', 'createdAt', 'updatedAt'],
              },
            },
            required: ['code', 'metadata'],
          },
        },
        {
          name: 'list_artifacts',
          description: 'List all published artifacts in your TOYBOX',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'update_config',
          description: 'Update TOYBOX configuration (title, theme, layout, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              config: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  theme: { type: 'string', enum: ['auto', 'light', 'dark'] },
                  layout: { type: 'string', enum: ['grid', 'list'] },
                  showFooter: { type: 'boolean' },
                },
              },
            },
            required: ['config'],
          },
        },
        {
          name: 'setup_remote',
          description: 'Set up a GitHub remote repository for an existing local TOYBOX (one-time setup)',
          inputSchema: {
            type: 'object',
            properties: {
              repoName: {
                type: 'string',
                description: 'Name for the GitHub repository',
              },
              isPrivate: {
                type: 'boolean',
                description: 'Create repository as private (default: false)',
                default: false,
              },
              enablePages: {
                type: 'boolean',
                description: 'Enable GitHub Pages for the repository (default: true)',
                default: true,
              },
            },
            required: ['repoName'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      log.info(`Tool call received: ${name}`, { args });

      try {
        switch (name) {
          case 'initialize_toybox': {
            const params = InitializeToyboxParamsSchema.parse(args);
            log.info('Executing initialize_toybox', { params });
            const result = await initializeToybox(params);
            log.info('initialize_toybox completed', { result });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'publish_artifact': {
            const params = PublishArtifactParamsSchema.parse(args);
            log.info('Executing publish_artifact', { title: params.metadata.title });
            const result = await publishArtifact(params);
            log.info('publish_artifact completed', { result });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'list_artifacts': {
            log.info('Executing list_artifacts');
            const result = await listArtifacts();
            log.info('list_artifacts completed', { artifactCount: result.artifacts?.length || 0 });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'update_config': {
            const { config } = args as { config: Record<string, unknown> };
            log.info('Executing update_config', { config });
            const result = await updateConfig(config);
            log.info('update_config completed', { result });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'setup_remote': {
            const params = SetupRemoteParamsSchema.parse(args);
            log.info('Executing setup_remote', { repoName: params.repoName });
            const result = await setupRemote(params);
            log.info('setup_remote completed', { result });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }
          
          case 'list_repositories': {
            log.info('Executing list_repositories');
            const result = await listRepositories();
            log.info('list_repositories completed', { repoCount: result.repositories?.length || 0 });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }
          
          case 'switch_repository': {
            const params = SwitchRepositoryParamsSchema.parse(args);
            log.info('Executing switch_repository', { repoName: params.repoName });
            const result = await switchRepository(params);
            log.info('switch_repository completed', { success: result.success });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }
          
          case 'remove_repository': {
            const params = RemoveRepositoryParamsSchema.parse(args);
            log.info('Executing remove_repository', { repoName: params.repoName });
            const result = await removeRepository(params);
            log.info('remove_repository completed', { success: result.success });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }
          
          case 'get_active_repository': {
            log.info('Executing get_active_repository');
            const result = await getActiveRepository();
            log.info('get_active_repository completed', { success: result.success, repoName: result.repository?.name });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            log.error(`Unknown tool called: ${name}`);
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        log.error(`Error executing ${name}`, { error: error instanceof Error ? error.message : String(error) });
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private setupResourceHandlers(): void {
    // Resources are not used in this server, but we need to handle the request
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: []
    }));
  }

  private setupPromptHandlers(): void {
    // Prompts are not used in this server, but we need to handle the request
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: []
    }));
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      log.error('MCP Server error', { error });
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      log.info('Received SIGINT, shutting down server');
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    log.info('TOYBOX MCP Server started and listening on stdio');
    console.error('TOYBOX MCP Server running on stdio');
  }
}

// Always start the server when this module is executed
const server = new ToyboxMCPServer();
server.run().catch((error) => {
  log.error('Failed to start server', { error });
  console.error('Failed to start server:', error);
  process.exit(1);
});