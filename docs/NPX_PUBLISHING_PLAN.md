# NPX Publishing Plan for TOYBOX MCP Server

## Overview

This document outlines the complete plan to make the TOYBOX MCP Server installable and runnable via npx, allowing users to configure it in Claude Desktop without a global installation.

## Goal

Enable users to run the MCP server with this configuration:
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

## Current State Analysis

### Package Structure
- **Package name**: `@isnbh0/toybox-mcp-server` (version 1.0.0)
- **Type**: ES Module (`"type": "module"`)
- **Entry point**: `dist/index.js` with shebang `#!/usr/bin/env node`
- **Binary name**: `toybox-mcp` (defined in `bin` field)
- **Build output**: TypeScript compiles to `dist/` directory

### Issues to Address
1. Malformed keywords array in package.json
2. TypeScript and type definitions in dependencies (should be devDependencies)
3. No `files` field to control published content
4. No automated build process before publishing
5. Template files currently bundled (need to fetch from GitHub instead)

## Implementation Steps

### 1. Fix package.json Configuration

#### 1.1 Fix Keywords Array
Current (malformed):
```json
"keywords": [
  "[\"mcp\"",
  "\"claude\"",
  "\"artifacts\"",
  "\"github-pages\"",
  "\"publishing\"",
  "\"portfolio\"]"
]
```

Should be:
```json
"keywords": [
  "mcp",
  "claude",
  "artifacts",
  "github-pages",
  "publishing",
  "portfolio",
  "toybox",
  "model-context-protocol"
]
```

#### 1.2 Add Files Field
```json
"files": [
  "dist",
  "README.md",
  "LICENSE"
]
```

#### 1.3 Update Scripts
```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1",
  "build": "rm -rf dist && tsc",
  "dev": "tsc --watch",
  "start": "node dist/index.js",
  "prepublishOnly": "npm run build",
  "postinstall": "node dist/postinstall.js || true"
}
```

### 2. Reorganize Dependencies

Move to devDependencies:
- `@types/fs-extra`
- `@types/inquirer`
- `@types/node`
- `@types/semver`
- `typescript`

Ensure these remain in dependencies:
- `@modelcontextprotocol/sdk`
- `@types/proper-lockfile` (used at runtime)
- `@types/uuid` (used at runtime)
- `commander`
- `execa`
- `fs-extra`
- `glob`
- `inquirer`
- `proper-lockfile`
- `semver`
- `uuid`
- `zod`

### 3. Create .npmignore File

```
# Source files
src/
*.ts
!dist/**/*.d.ts

# Test files
test-*.js
__tests__/
*.test.*
*.spec.*

# Development files
scripts/
.vscode/
.idea/

# Template files (now fetched from GitHub)
template/
template.zip

# Configuration files
tsconfig.json
.eslintrc*
.prettierrc*

# Documentation (except README)
*.md
!README.md
!LICENSE

# Git files
.git/
.gitignore
.github/

# Logs and temp files
*.log
npm-debug.log*
.DS_Store
*.swp
*.swo
*~

# Dependencies
node_modules/

# Build artifacts
*.tsbuildinfo
```

### 4. Update Template Handling

Since we're removing local template files, update the code to fetch from GitHub:

#### 4.1 Update init.ts Handler
- Remove references to local template directory
- Update to clone from `https://github.com/isnbh0/toybox-template`
- Remove `copyTemplate` utility usage
- Handle template fetching errors gracefully

#### 4.2 Remove Template-Related Code
- Delete `src/utils/copyTemplate.ts`
- Remove `template.zip` generation scripts
- Update any imports or references

### 5. Add Post-Install Script (Optional)

Create `src/postinstall.ts`:
```typescript
#!/usr/bin/env node
// Check for required dependencies (gh cli)
// Provide helpful setup instructions if missing
```

### 6. Testing Strategy

#### 6.1 Local Build Test
```bash
npm run build
node dist/index.js
```

#### 6.2 Local npx Test
```bash
npm link
npx @isnbh0/toybox-mcp-server
```

#### 6.3 Pack Test
```bash
npm pack
# Examine the generated tarball
tar -tzf isnbh0-toybox-mcp-server-*.tgz
```

#### 6.4 Integration Test
1. Create test Claude Desktop config
2. Run the server via npx
3. Test all MCP tools

### 7. Publishing Process

#### 7.1 Pre-publish Checklist
- [ ] All tests passing
- [ ] Version bumped appropriately
- [ ] CHANGELOG updated
- [ ] README updated with npx instructions
- [ ] Built files in dist/ are current

#### 7.2 Publish Commands
```bash
npm login
npm publish --access public
```

#### 7.3 Post-publish Verification
```bash
npx @isnbh0/toybox-mcp-server@latest
npm view @isnbh0/toybox-mcp-server
```

### 8. Documentation Updates

#### 8.1 README.md Updates
- Change installation section to use npx
- Add troubleshooting for common npx issues
- Update Claude Desktop config example

#### 8.2 CLAUDE_DESKTOP_SETUP.md Updates
- Replace direct command with npx configuration
- Add version pinning recommendations
- Include cache clearing instructions

#### 8.3 New Documentation
- Create PUBLISHING.md with release process
- Add CONTRIBUTING.md with development setup

## Contingency Planning

### Issue: npx Fails to Execute

**Symptoms**: Command not found or permission errors

**Solutions**:
1. Ensure shebang is preserved in dist/index.js
2. Check file permissions (should be executable)
3. Verify npm registry availability
4. Try with `--no-cache` flag

### Issue: Template Fetching Fails

**Symptoms**: Cannot clone template repository

**Solutions**:
1. Add retry logic with exponential backoff
2. Provide manual template URL override option
3. Cache template locally after first fetch
4. Add offline mode with helpful error message

### Issue: GitHub CLI Not Available

**Symptoms**: `gh` command not found

**Solutions**:
1. Detect in postinstall script
2. Provide installation instructions
3. Consider bundling minimal git operations
4. Add fallback to use git directly

### Issue: Large Package Size

**Symptoms**: Slow npx execution, timeout errors

**Solutions**:
1. Minimize dependencies
2. Use tree-shaking for MCP SDK
3. Consider lazy loading for handlers
4. Split into core and optional packages

### Issue: Version Conflicts

**Symptoms**: Multiple versions cause conflicts

**Solutions**:
1. Use specific version in npx command
2. Add version compatibility checks
3. Implement graceful degradation
4. Clear npx cache instructions

## Success Criteria

1. ✅ Package publishes successfully to npm
2. ✅ npx command executes without global install
3. ✅ All MCP tools function correctly
4. ✅ Template fetches from GitHub repository
5. ✅ No local template files in published package
6. ✅ Package size under 1MB (excluding dependencies)
7. ✅ Works on macOS, Linux, and Windows
8. ✅ Clear error messages for common issues

## Rollback Plan

If issues arise after publishing:

1. **Immediate**: Unpublish broken version
   ```bash
   npm unpublish @isnbh0/toybox-mcp-server@VERSION
   ```

2. **Fix Forward**: Publish patch version quickly
   ```bash
   npm version patch
   npm publish
   ```

3. **Communication**: Update GitHub issues and Discord

## Future Enhancements

1. **Automated Testing**: GitHub Actions for CI/CD
2. **Version Management**: Semantic release automation
3. **Performance**: Bundle optimization, faster startup
4. **Features**: Offline mode, template caching
5. **Distribution**: Consider standalone binaries

## Timeline

- **Phase 1** (1 hour): Package.json fixes and dependency reorganization
- **Phase 2** (2 hours): Template handling refactor
- **Phase 3** (1 hour): Testing and validation
- **Phase 4** (30 min): Documentation updates
- **Phase 5** (30 min): Publishing and verification

Total estimated time: 5 hours

## Notes

- Always test with `npm pack` before publishing
- Consider beta releases for major changes
- Monitor npm download stats and issues
- Keep Claude Desktop compatibility as top priority
- Remember to update version number before each publish