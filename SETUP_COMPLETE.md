# TOYBOX MCP Server Debug Mode Setup Complete

## ✅ What's Been Implemented

### 1. **Debug Mode Support**
- Added `debug` and `localTemplatePath` parameters to initialization
- Environment variable support via `TOYBOX_DEBUG` and `TOYBOX_LOCAL_TEMPLATE_PATH`
- Local template copying instead of GitHub cloning when in debug mode

### 2. **JSX Configuration Optimized**
- Added explicit esbuild JSX settings (`jsx: 'automatic'`) to Vite config
- Ensured artifacts directory is included in TypeScript compilation
- Configured automatic React JSX transformation for better development experience

### 3. **Claude Desktop Integration**
- Updated `~/Library/Application Support/Claude/claude_desktop_config.json` 
- Added environment variables to automatically enable debug mode
- MCP server now launches in debug mode by default

### 4. **Template Management**
- Created `toybox-mcp-server/template/` directory for local template storage
- Built setup script: `./toybox-mcp-server/scripts/setup-template.sh`
- Template directory populated with current TOYBOX files

### 5. **Configuration System**
- Added persistent state management with `~/.toybox.json`
- Implemented thread-safe config operations with atomic writes and file locking
- Multi-repository support with active repository concept
- Automatic state updates when repositories are used

### 6. **New MCP Commands**
- `list_repositories` - Show all configured TOYBOX repositories
- `switch_repository` - Change active repository
- `remove_repository` - Remove repository from config
- `get_active_repository` - Show current active repository

### 7. **Configuration Files Updated**
- `types.ts` - Added debug parameters with environment variable defaults
- `init.ts` - Implemented debug mode logic and config integration
- `publish.ts` - Updated to use active repository from config
- `list.ts` - Updated to use active repository from config
- `index.ts` - Exposed all new MCP commands
- `tsconfig.json` - Excluded template directory from compilation

## 🚀 Current State

Your Claude Desktop is now configured to:
1. **Always use debug mode** when initializing TOYBOX repositories
2. **Copy from local template** instead of cloning from GitHub
3. **Skip GitHub authentication** and remote operations
4. **Create local repositories** in `~/repository-name/` for development

## 📋 Next Steps

### To Test the Setup:
1. **Restart Claude Desktop** (important for config changes to take effect)
2. Open Claude Desktop and say: *"Create a new TOYBOX called 'test-debug-box'"*
3. Claude should initialize using debug mode automatically
4. Check `~/test-debug-box/` for the new repository

### To Update Templates:
When you make changes to the main TOYBOX repository:
```bash
cd /path/to/toybox
./toybox-mcp-server/scripts/setup-template.sh
```

### To Switch Back to Production Mode:
Edit `~/Library/Application Support/Claude/claude_desktop_config.json` and change:
```json
"TOYBOX_DEBUG": "false"
```

## 📁 Files Created/Modified

### New Files:
- `toybox-mcp-server/src/utils/copyTemplate.ts` - Template copying utility
- `toybox-mcp-server/src/types/config.ts` - Configuration schema definitions
- `toybox-mcp-server/src/services/config.ts` - Thread-safe configuration service
- `toybox-mcp-server/src/handlers/repository.ts` - Repository management commands
- `toybox-mcp-server/template/` - Local template directory
- `toybox-mcp-server/scripts/setup-template.sh` - Template setup script
- `toybox-mcp-server/DEBUG_MODE.md` - Debug mode documentation
- `toybox-mcp-server/CLAUDE_DESKTOP_SETUP.md` - Claude Desktop configuration guide
- `toybox-mcp-server/CONFIG_SYSTEM.md` - Configuration system documentation

### Modified Files:
- `toybox-mcp-server/src/types.ts` - Added debug parameters
- `toybox-mcp-server/src/handlers/init.ts` - Added config integration and debug mode
- `toybox-mcp-server/src/handlers/publish.ts` - Updated to use config for repository location
- `toybox-mcp-server/src/handlers/list.ts` - Updated to use config for repository location
- `toybox-mcp-server/src/index.ts` - Added repository management commands
- `toybox-mcp-server/tsconfig.json` - Excluded template directory
- `toybox-mcp-server/package.json` - Added proper-lockfile dependency
- `~/Library/Application Support/Claude/claude_desktop_config.json` - Added debug environment variables

## 🔧 Current Claude Desktop Configuration

```json
{
  "mcpServers": {
    "toybox": {
      "command": "node",
      "args": ["/Users/jhchoi/local/src/toybox/toybox-mcp-server/dist/index.js"],
      "env": {
        "TOYBOX_DEBUG": "true",
        "TOYBOX_LOCAL_TEMPLATE_PATH": "/Users/jhchoi/local/src/toybox/toybox-mcp-server/template"
      }
    }
  }
}
```

## ✨ What This Means

You can now:
- **Develop TOYBOX locally** without GitHub dependencies
- **Test template changes instantly** without pushing to GitHub
- **Work offline** for TOYBOX development
- **Create TOYBOX repositories** through natural conversation in Claude Desktop
- **Iterate quickly** on template modifications

The debug mode is now fully integrated and persistent across Claude Desktop sessions!