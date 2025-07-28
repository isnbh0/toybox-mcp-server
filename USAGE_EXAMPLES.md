# TOYBOX MCP Server Usage Examples

This document provides practical examples of using the TOYBOX MCP server with the new configuration system.

## Basic Workflow

### 1. Initialize Your First TOYBOX

```javascript
// This will create a repository and automatically set it as active
initialize_toybox({
  repoName: "my-portfolio",
  templateOwner: "ignored-in-debug-mode" // Required but ignored in debug mode
})
```

**What happens:**
- Repository created at `~/my-portfolio/`
- Added to `~/.toybox.json` configuration
- Set as the active repository
- Ready for publishing artifacts

### 2. Publish Your First Artifact

```javascript
// This will use the active repository automatically
publish_artifact({
  code: `
export default function WelcomeMessage() {
  return (
    <div className="text-center p-8">
      <h1 className="text-4xl font-bold text-blue-600">
        Welcome to My TOYBOX!
      </h1>
      <p className="mt-4 text-gray-600">
        This is my first published artifact.
      </p>
    </div>
  );
}`,
  metadata: {
    title: "Welcome Message",
    description: "A simple welcome component",
    type: "react",
    tags: ["welcome", "intro"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
})
```

### 3. List Your Artifacts

```javascript
// Shows all artifacts in the active repository
list_artifacts()
```

## Multi-Repository Workflow

### Managing Multiple TOYBOX Repositories

```javascript
// Create a second repository for experiments
initialize_toybox({
  repoName: "experiments",
  templateOwner: "ignored-in-debug-mode"
})

// List all your repositories
list_repositories()
// Shows: my-portfolio (inactive), experiments (active)

// Switch back to your main portfolio
switch_repository({ repoName: "my-portfolio" })

// Verify which repository is active
get_active_repository()
```

### Organizing Your Work

```javascript
// Work repository for client projects
initialize_toybox({
  repoName: "client-work",
  templateOwner: "ignored-in-debug-mode"
})

// Personal experiments
initialize_toybox({
  repoName: "playground", 
  templateOwner: "ignored-in-debug-mode"
})

// Portfolio for showcasing best work
switch_repository({ repoName: "my-portfolio" })
```

## Configuration Management

### Check Your Configuration

```javascript
// See all repositories
list_repositories()

// See which one is currently active
get_active_repository()
```

### Clean Up Old Repositories

```javascript
// Remove a repository from configuration (files not deleted)
remove_repository({ repoName: "old-experiments" })

// The repository files remain at ~/old-experiments/
// but it's no longer tracked by the MCP server
```

## Development Workflow

### Debug Mode Benefits

With debug mode enabled (via Claude Desktop config), you get:

1. **No GitHub Authentication Required**
2. **Local Template Usage** - Uses your local development template
3. **Faster Initialization** - No network operations
4. **Offline Development** - Works without internet

### Switching Modes

**For Development:**
```json
// In ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "toybox": {
      "env": {
        "TOYBOX_DEBUG": "true"
      }
    }
  }
}
```

**For Production:**
```json
{
  "mcpServers": {
    "toybox": {
      "env": {
        "TOYBOX_DEBUG": "false"
      }
    }
  }
}
```

## Advanced Usage

### Custom Template Paths

```javascript
// Use a custom template directory
initialize_toybox({
  repoName: "custom-styled",
  templateOwner: "ignored-in-debug-mode",
  debug: true,
  localTemplatePath: "/path/to/my/custom/template"
})
```

### Working with Artifacts

```javascript
// Publish a complex interactive component
publish_artifact({
  code: `
import { useState } from 'react';

export default function InteractiveCounter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-2xl font-bold">Interactive Counter</h2>
      <div className="text-6xl font-mono">{count}</div>
      <div className="flex gap-2">
        <button 
          onClick={() => setCount(c => c - 1)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          -1
        </button>
        <button 
          onClick={() => setCount(0)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          +1
        </button>
      </div>
    </div>
  );
}`,
  metadata: {
    title: "Interactive Counter",
    description: "A counter with increment, decrement, and reset functionality",
    type: "react",
    tags: ["interactive", "state", "counter", "demo"],
    folder: "Interactive Components",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
})
```

## Configuration File Structure

Your `~/.toybox.json` will look like this after using multiple repositories:

```json
{
  "version": "1.0.0",
  "repositories": [
    {
      "name": "my-portfolio",
      "localPath": "/Users/username/my-portfolio",
      "remoteUrl": "file:///Users/username/my-portfolio",
      "publishedUrl": "http://localhost:5173/",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "lastUsedAt": "2024-01-01T15:30:00.000Z",
      "isActive": true
    },
    {
      "name": "experiments",
      "localPath": "/Users/username/experiments", 
      "remoteUrl": "file:///Users/username/experiments",
      "publishedUrl": "http://localhost:5174/",
      "createdAt": "2024-01-01T11:00:00.000Z",
      "lastUsedAt": "2024-01-01T14:20:00.000Z",
      "isActive": false
    }
  ],
  "activeRepository": "my-portfolio",
  "debug": true,
  "localTemplatePath": "/Users/username/src/toybox/toybox-mcp-server/template",
  "lastUpdated": "2024-01-01T15:30:00.000Z",
  "preferences": {
    "defaultRepoName": "toybox",
    "autoCommit": true,
    "commitMessage": "feat: Add new artifact via TOYBOX"
  }
}
```

## Troubleshooting Common Scenarios

### "No active repository found"
```javascript
// Check what repositories exist
list_repositories()

// If none exist, create one
initialize_toybox({
  repoName: "my-toybox",
  templateOwner: "ignored-in-debug-mode"
})

// If repositories exist but none active, switch to one
switch_repository({ repoName: "existing-repo-name" })
```

### Repository path no longer exists
```javascript
// Remove the invalid repository
remove_repository({ repoName: "missing-repo" })

// Create a new one
initialize_toybox({
  repoName: "new-repo",
  templateOwner: "ignored-in-debug-mode"
})
```

### Multiple repositories confusion
```javascript
// See all repositories and their status
list_repositories()

// Switch to the one you want to use
switch_repository({ repoName: "preferred-repo" })

// Confirm it's active
get_active_repository()
```

This configuration system makes it easy to manage multiple TOYBOX repositories and switch between them as needed for different projects or purposes.