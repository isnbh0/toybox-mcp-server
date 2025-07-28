# TOYBOX MCP Server - Local Development & Testing

This guide covers how to test the TOYBOX MCP Server locally from source code before publishing to npm.

## Prerequisites

1. **Node.js 18+**: Ensure you have Node.js 18 or later installed
2. **GitHub CLI**: Install from [cli.github.com](https://cli.github.com/)
3. **GitHub Authentication**: Run `gh auth login` and complete browser authentication
4. **Claude Desktop**: Latest version with MCP support

## Local Development Setup

### 1. Build the MCP Server

```bash
cd toybox-mcp-server
npm install
npm run build
```

This creates the compiled JavaScript in the `dist/` directory.

### 2. Test the Build

Verify the server starts without errors:

```bash
npm start
```

You should see: `TOYBOX MCP Server running on stdio`

Press `Ctrl+C` to stop.

### 3. Make the Server Executable

```bash
# Make the compiled server executable
chmod +x dist/index.js

# Test direct execution
node dist/index.js
```

## Claude Desktop Configuration

### Option A: Direct Path (Recommended for Testing)

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "toybox": {
      "command": "node",
      "args": ["/absolute/path/to/toybox-mcp-server/dist/index.js"]
    }
  }
}
```

**Important**: Replace `/absolute/path/to/toybox-mcp-server/` with the actual absolute path to your development directory.

### Option B: Global Link (Alternative)

```bash
# Link for global testing
npm link

# This allows you to use the package name directly
```

Then configure Claude Desktop:

```json
{
  "mcpServers": {
    "toybox": {
      "command": "toybox-mcp"
    }
  }
}
```

## Testing Workflow

### 1. Restart Claude Desktop

After updating the configuration, restart Claude Desktop completely to load the MCP server.

### 2. Verify MCP Connection

In Claude Desktop, you should see the TOYBOX tools available. Try:

```
"What MCP tools do you have access to?"
```

You should see:
- `initialize_toybox`
- `publish_artifact` 
- `list_artifacts`
- `update_config`

### 3. Test GitHub Authentication

```
"Check if I'm authenticated with GitHub CLI"
```

This will verify your `gh auth login` setup.

### 4. Test Repository Initialization

```
"I want to create a test TOYBOX called 'toybox-test'"
```

This should:
- Create a GitHub repository
- Clone it locally to `~/toybox-test`
- Enable GitHub Pages
- Return the published URL

### 5. Test Artifact Publishing

Create a simple artifact:

```
"Create a simple React button component that says 'Hello TOYBOX'"
```

Then publish it:

```
"Publish this to my TOYBOX"
```

### 6. Test Artifact Listing

```
"Show me all my TOYBOX projects"
```

## Development Debugging

### Enable Debug Logging

Add debug output to your development version:

```bash
# Edit src/index.ts and add console.error() statements
# Rebuild after changes
npm run build
```

### Check MCP Communication

Claude Desktop logs MCP communication. Check:

**macOS**: `~/Library/Logs/Claude/`
**Windows**: Check Windows Event Viewer or Claude app logs

### Test GitHub CLI Directly

Verify GitHub CLI works outside of MCP:

```bash
gh auth status
gh repo list --limit 5
```

### Test Git Operations

Verify git works in your expected directory:

```bash
cd ~/toybox-test  # or wherever your test repo is
git status
git log --oneline -5
```

## Common Issues & Solutions

### "Command not found" Error

- Verify the absolute path in your Claude Desktop config
- Check that `npm run build` completed successfully
- Ensure the `dist/index.js` file exists and is executable

### "Not authenticated" Error

```bash
gh auth status
# If not authenticated:
gh auth login
```

### "Repository already exists" Error

- Choose a different repository name
- Or delete the existing repository: `gh repo delete your-username/repo-name`

### "No TOYBOX repository found" Error

- Ensure you've run `initialize_toybox` first
- Check that the repository was cloned to the expected location
- Verify the local directory has the correct structure

### MCP Connection Issues

- Restart Claude Desktop completely
- Check the JSON syntax in your config file
- Verify the absolute path is correct
- Check Claude Desktop logs for specific error messages

## File Structure for Testing

After successful initialization, you should see:

```
~/toybox-test/                    # Your test repository
├── src/artifacts/                # Published artifacts appear here
│   ├── .gitkeep
│   └── hello-toybox.tsx         # Your test artifact
├── TOYBOX_CONFIG.json           # Configuration
└── (other template files...)
```

## Cleanup After Testing

When done testing:

```bash
# Remove the linked package (if using npm link)
npm unlink -g

# Delete test repositories
gh repo delete your-username/toybox-test

# Remove local test directory  
rm -rf ~/toybox-test
```

## Next Steps

Once local testing is successful:
1. Package for distribution (`npm pack`)
2. Test the packaged version
3. Publish to npm registry (`npm publish`)
4. Update documentation for end users