# Claude Desktop Setup for TOYBOX Debug Mode

This guide shows how to configure Claude Desktop to run the TOYBOX MCP Server in debug mode by default.

## Configuration

### 1. Locate Your Claude Desktop Config

The configuration file is located at:
```
~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### 2. Add Environment Variables

Update your `claude_desktop_config.json` to include environment variables for the TOYBOX MCP server:

```json
{
  "mcpServers": {
    "toybox": {
      "command": "node",
      "args": ["/path/to/your/toybox/toybox-mcp-server/dist/index.js"],
      "env": {
        "TOYBOX_DEBUG": "true",
        "TOYBOX_LOCAL_TEMPLATE_PATH": "/path/to/your/toybox/toybox-mcp-server/template"
      }
    }
  }
}
```

### 3. Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TOYBOX_DEBUG` | Enable debug mode (`"true"` or `"false"`) | `"true"` |
| `TOYBOX_LOCAL_TEMPLATE_PATH` | Path to local template directory | `"/Users/jhchoi/local/src/toybox/toybox-mcp-server/template"` |

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
      "command": "node",
      "args": ["/Users/jhchoi/local/src/toybox/toybox-mcp-server/dist/index.js"],
      "env": {
        "TOYBOX_DEBUG": "true",
        "TOYBOX_LOCAL_TEMPLATE_PATH": "/Users/jhchoi/local/src/toybox/toybox-mcp-server/template"
      }
    }
  },
  "globalShortcut": ""
}
```

## Setup Steps

### 1. Build the MCP Server
```bash
cd /path/to/your/toybox/toybox-mcp-server
npm run build
```

### 2. Setup the Template Directory
```bash
cd /path/to/your/toybox
./toybox-mcp-server/scripts/setup-template.sh
```

### 3. Update Claude Desktop Config
Edit `~/Library/Application\ Support/Claude/claude_desktop_config.json` with the configuration above.

### 4. Restart Claude Desktop
Close and reopen Claude Desktop for the changes to take effect.

## How It Works

With debug mode enabled:

1. **Environment Variables**: The MCP server reads `TOYBOX_DEBUG` and `TOYBOX_LOCAL_TEMPLATE_PATH` on startup
2. **Default Behavior**: All `initialize_toybox` calls will use debug mode by default
3. **No GitHub Required**: No need for GitHub authentication or internet connection
4. **Local Templates**: Uses your local template files instead of cloning from GitHub

## Usage

Once configured, you can simply say:

```
"Create a new TOYBOX called 'my-test-box'"
```

And Claude will automatically:
- Use debug mode (no GitHub operations)
- Copy from your local template
- Create the repository in `~/my-test-box/`
- Initialize it for local development

## Override Debug Mode

You can still override debug mode for specific calls:

```javascript
initialize_toybox({
  repoName: "production-toybox",
  templateOwner: "your-github-username",
  debug: false  // This will override the environment variable
})
```

## Troubleshooting

### MCP Server Not Starting
- Check that the path in `args` points to your built MCP server
- Ensure you've run `npm run build` in the MCP server directory

### Template Errors
- Run the setup script: `./toybox-mcp-server/scripts/setup-template.sh`
- Check that the template path in `TOYBOX_LOCAL_TEMPLATE_PATH` exists

### Changes Not Taking Effect
- Restart Claude Desktop completely
- Check the MCP server logs for any errors