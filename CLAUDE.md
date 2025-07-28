# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

**Build and Run:**
```bash
npm install      # Install dependencies
npm run build    # Compile TypeScript to dist/
npm run dev      # Watch mode for development
npm start        # Run the compiled server
```

**Testing:**
```bash
# No automated tests currently - manual testing via Claude Desktop
# See DEVELOPMENT.md for local testing instructions
```

## High-level Architecture

**TOYBOX MCP Server** is a Model Context Protocol server that enables publishing artifacts from Claude Desktop to GitHub Pages portfolios.

### Core Architecture:

1. **MCP Server Layer** (`src/index.ts`): 
   - Registers tools with Claude Desktop via stdio
   - Routes commands to appropriate handlers
   - Uses Zod schemas for input validation

2. **Command Handlers** (`src/handlers/`):
   - `init.ts`: Creates GitHub repo, clones locally, enables Pages
   - `publish.ts`: Validates and publishes artifacts with unique IDs
   - `list.ts`: Retrieves all published artifacts
   - `config.ts`: Updates TOYBOX configuration
   - `setup-remote.ts`: Configures GitHub remote for existing repos

3. **Service Layer** (`src/services/`):
   - `git.ts`: Git operations via execa (status, add, commit, push)
   - `github.ts`: GitHub CLI wrapper (repo creation, Pages setup)
   - `artifacts.ts`: Artifact validation and file management
   - `config.ts`: TOYBOX_CONFIG.json management with file locking

4. **Template System**:
   - React app template in `template/` directory
   - Copied to user's repo during initialization
   - GitHub Actions workflow auto-deploys on push

### Key Design Decisions:

- **Unique IDs**: Artifacts use slug + UUID suffix to prevent collisions
- **File Locking**: Proper-lockfile prevents concurrent config modifications
- **Validation**: Strict TypeScript/React validation before publishing
- **Error Handling**: User-friendly messages for common issues
- **GitHub CLI**: Leverages `gh` for authentication and API operations

### Workflow:

1. User initializes TOYBOX → Creates GitHub repo from template
2. User publishes artifact → Validates, adds to `src/artifacts/`, commits, pushes
3. GitHub Actions → Builds React app, deploys to Pages
4. User views portfolio → Live site shows all published artifacts

## Important Notes

- Always use `execa` for external commands (git, gh)
- Validate all user input with Zod schemas
- Use proper-lockfile when modifying TOYBOX_CONFIG.json
- Artifact IDs must be unique (slug-uuid format)
- Template files in `template/` are copied as-is during init
- GitHub CLI (`gh`) must be authenticated before operations