# Claude Desktop Setup for TOYBOX MCP Server

This guide shows how to configure Claude Desktop to run the TOYBOX MCP Server using npx.

## Configuration

### 1. Locate Your Claude Desktop Config

The configuration file is located at:
```
~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### 2. Add TOYBOX MCP Server Configuration

Update your `claude_desktop_config.json` to include the TOYBOX MCP server using npx:

```json
{
  "mcpServers": {
    "toybox": {
      "command": "npx",
      "args": ["@isnbh0/toybox-mcp-server@latest"]
    }
  }
}
```

### 3. Optional Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TOYBOX_DEBUG` | Enable debug mode for local development | `"false"` | `"true"` |

To enable debug mode, add it to the configuration:

```json
{
  "mcpServers": {
    "toybox": {
      "command": "npx",
      "args": ["@isnbh0/toybox-mcp-server@latest"],
      "env": {
        "TOYBOX_DEBUG": "true"
      }
    }
  }
}
```

## Complete Example Configuration

Here's a complete example of `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/jhchoi/Desktop",
        "/Users/jhchoi/Downloads"
      ]
    },
    "toybox": {
      "command": "npx",
      "args": ["@isnbh0/toybox-mcp-server@latest"]
    }
  },
  "globalShortcut": ""
}
```

## Setup Steps

### 1. Update Claude Desktop Config
Edit `~/Library/Application\ Support/Claude/claude_desktop_config.json` with the configuration above.

### 2. Restart Claude Desktop
Close and reopen Claude Desktop for the changes to take effect.

### 3. Test the Installation
The first time you use TOYBOX, npx will automatically download and install the latest version.

## How It Works

1. **NPX Installation**: When Claude Desktop starts, npx will download and cache the TOYBOX MCP server
2. **Template Fetching**: Templates are fetched from GitHub (https://github.com/isnbh0/toybox)
3. **GitHub Integration**: Requires GitHub CLI (`gh`) for creating repositories and enabling Pages
4. **Debug Mode**: When enabled, creates local repositories without GitHub integration

## Usage

Once configured, you can simply say:

```
"Create a new TOYBOX called 'my-portfolio'"
```

And Claude will automatically:
- Clone the template from GitHub
- Create a GitHub repository (if createRemote: true)
- Set up GitHub Pages for publishing
- Initialize it for artifact publishing

## Version Pinning

For production use, consider pinning to a specific version:

```json
{
  "mcpServers": {
    "toybox": {
      "command": "npx",
      "args": ["@isnbh0/toybox-mcp-server@1.0.0"]
    }
  }
}
```

## Troubleshooting

### MCP Server Not Starting
- Ensure you have Node.js installed (version 18 or later)
- Check your internet connection (npx needs to download the package)
- Try clearing npx cache: `npx --yes @isnbh0/toybox-mcp-server@latest`

### Template Download Fails
- Check your internet connection
- Verify GitHub is accessible from your network
- Try using debug mode for local development without GitHub

### GitHub Authentication Issues
- Install GitHub CLI: `brew install gh` (macOS) or visit https://cli.github.com/
- Authenticate: `gh auth login`
- Check authentication: `gh auth status`

### NPX Cache Issues
- Clear cache: `npm cache clean --force`
- Use specific version: `npx @isnbh0/toybox-mcp-server@latest`

### Changes Not Taking Effect
- Restart Claude Desktop completely
- Check that the configuration file syntax is valid JSON