# TOYBOX Configuration System

The TOYBOX MCP server now maintains persistent state through a configuration file stored in the user's home directory at `~/.toybox.json`. This document explains the design principles, implementation, and usage of the configuration system.

## Design Principles

### 1. **Safety First**
- **Atomic writes**: Uses write-rename pattern to prevent corruption
- **File locking**: Prevents concurrent modifications using `proper-lockfile`
- **Schema validation**: All data validated with Zod schemas before persistence
- **Graceful degradation**: Creates default config if file is missing or corrupted

### 2. **Data Integrity**
- **Type safety**: TypeScript + Zod for compile-time and runtime validation
- **Migration support**: Built-in versioning for future config format changes
- **Backup on corruption**: Invalid configs are replaced with defaults rather than failing

### 3. **User Experience**
- **Transparent operation**: Config managed automatically by MCP commands
- **Multi-repository support**: Track multiple TOYBOX repositories
- **Active repository concept**: Simple workflow with one "current" repository
- **Persistent preferences**: User settings survive across sessions

## Configuration Structure

### File Location
```
~/.toybox.json
```

### Schema Overview
```typescript
{
  version: "1.0.0",
  repositories: [
    {
      name: "my-toybox",
      localPath: "/Users/username/my-toybox",
      remoteUrl: "https://github.com/username/my-toybox.git",
      publishedUrl: "https://username.github.io/my-toybox",
      createdAt: "2024-01-01T00:00:00.000Z",
      lastUsedAt: "2024-01-02T12:30:00.000Z",
      isActive: true,
      metadata: {} // For future extensibility
    }
  ],
  activeRepository: "my-toybox",
  debug: false,
  localTemplatePath: "/path/to/template",
  lastUpdated: "2024-01-02T12:30:00.000Z",
  preferences: {
    defaultRepoName: "toybox",
    autoCommit: true,
    commitMessage: "feat: Add new artifact via TOYBOX"
  }
}
```

## Implementation Details

### ConfigService Class

The `ConfigService` class provides thread-safe operations:

```typescript
const configService = new ConfigService();

// Read current config (creates default if missing)
const config = await configService.read();

// Atomic update with locking
await configService.update(config => {
  config.debug = true;
  return config;
});

// Repository operations
await configService.upsertRepository(repoConfig);
await configService.setActiveRepository("my-toybox");
const activeRepo = await configService.getActiveRepository();
```

### File Operations

1. **Read Operations**:
   - Check if file exists
   - Parse JSON and validate with Zod
   - Run migrations if needed
   - Return default config on any error

2. **Write Operations**:
   - Validate data with Zod schema
   - Write to temporary file
   - Atomic rename to final location
   - Clean up on failure

3. **Update Operations**:
   - Acquire file lock
   - Read current state
   - Apply update function
   - Write new state
   - Release lock

## Best Practices Implemented

### 1. **Atomic Operations**
```typescript
// Write to temp file first
await fs.writeFile(`${configPath}.tmp`, data);
// Atomic rename
await fs.rename(`${configPath}.tmp`, configPath);
```

### 2. **Proper Locking**
```typescript
const release = await lockfile.lock(configPath, {
  retries: 5,
  stale: 5000
});
try {
  // ... perform operations
} finally {
  await release();
}
```

### 3. **Schema Validation**
```typescript
// Runtime validation
const validConfig = ToyboxConfigSchema.parse(rawConfig);
```

### 4. **Error Handling**
```typescript
try {
  // ... operations
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation errors gracefully
    return createDefaultConfig();
  }
  throw error;
}
```

## MCP Commands Integration

### Repository Management
- `initialize_toybox` - Creates and registers new repositories
- `list_repositories` - Shows all configured repositories
- `switch_repository` - Changes active repository
- `remove_repository` - Unregisters repository (doesn't delete files)
- `get_active_repository` - Shows current active repository

### Automatic State Updates
- `publish_artifact` - Updates `lastUsedAt` timestamp
- `list_artifacts` - Updates `lastUsedAt` timestamp
- All operations automatically update `lastUpdated` in config

## Usage Examples

### Initialize New Repository
```javascript
// Creates repository and adds to config automatically
initialize_toybox({
  repoName: "my-portfolio",
  templateOwner: "username",
  debug: true
})
```

### Switch Between Repositories
```javascript
// List all repositories
list_repositories()

// Switch to different repository
switch_repository({ repoName: "my-portfolio" })

// All subsequent operations use the active repository
publish_artifact({ code: "...", metadata: {...} })
```

### Environment Integration
The config system respects environment variables:
- `TOYBOX_DEBUG=true` - Sets default debug mode
- `TOYBOX_LOCAL_TEMPLATE_PATH=/path` - Sets default template path

## Security Considerations

### 1. **File Permissions**
- Config file created with user-only read/write permissions
- Temporary files cleaned up on failure

### 2. **Path Validation**
- All paths validated and normalized
- No path traversal vulnerabilities

### 3. **Input Sanitization**
- All user input validated with Zod schemas
- Malformed data rejected safely

### 4. **Concurrent Access**
- File locking prevents race conditions
- Atomic operations prevent partial writes

## Migration Strategy

The config system supports versioned migrations:

```typescript
private async migrate(config: ToyboxConfig): Promise<ToyboxConfig> {
  if (config.version === '0.9.0') {
    config = migrateFrom090To100(config);
  }
  config.version = CONFIG_VERSION;
  return config;
}
```

Future changes to the config format can be handled gracefully without breaking existing installations.

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure `~/.toybox.json` is writable
2. **Lock Timeouts**: Check for stuck processes holding locks
3. **Corruption**: Config automatically recreated if corrupted
4. **Missing Repositories**: Use `list_repositories` to verify state

### Debug Information
- Config file location: `~/.toybox.json`
- Lock files: `~/.toybox.json.lock`
- Temp files: `~/.toybox.json.tmp` (should not persist)

The configuration system provides a robust foundation for maintaining TOYBOX state while following best practices for local file management.