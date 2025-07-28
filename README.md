# TOYBOX MCP Server

Zero-friction publishing platform for Claude artifacts via Model Context Protocol (MCP).

## Overview

TOYBOX MCP Server enables Claude Desktop users to publish their artifacts to a personal GitHub Pages portfolio site through simple conversational commands. No technical knowledge required!

## Features

- 🚀 **Zero-friction setup**: Initialize your TOYBOX with one command
- 📦 **Instant publishing**: Publish artifacts directly from Claude Desktop
- 🎨 **Professional presentation**: Automated portfolio site with responsive design
- 🔧 **Customizable**: Configure themes, layouts, and branding
- 📱 **Mobile-friendly**: Works perfectly on all devices
- 🔒 **Secure**: All code validation and safe deployment practices

## Prerequisites

1. **GitHub Account**: Create one at [github.com](https://github.com)
2. **GitHub CLI**: Install from [cli.github.com](https://cli.github.com/)
3. **Authentication**: Run `gh auth login` and follow the browser flow

## Installation

```bash
npm install -g @toybox/mcp-server
```

## Configuration

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "toybox": {
      "command": "toybox-mcp"
    }
  }
}
```

## Usage

### 1. Initialize Your TOYBOX

In Claude Desktop:

```
"I want to create a TOYBOX for my projects"
```

Claude will:
- Check your GitHub authentication
- Create a repository from the TOYBOX template
- Enable GitHub Pages
- Set up local development environment

### 2. Publish Artifacts

Create any artifact in Claude Desktop, then:

```
"Publish this to my TOYBOX"
```

Claude will:
- Generate a unique ID for your artifact
- Commit and push to GitHub
- Provide the live URL

### 3. Manage Your Collection

```
"Show me all my TOYBOX projects"
"Update my TOYBOX theme to dark mode"
"Change my TOYBOX title to 'My Creative Projects'"
```

## Available Commands

| Command | Description |
|---------|-------------|
| `initialize_toybox` | Set up a new TOYBOX repository |
| `publish_artifact` | Publish an artifact to your TOYBOX |
| `list_artifacts` | Show all published artifacts |
| `update_config` | Modify TOYBOX settings |

## Configuration Options

- **Title**: Display name for your portfolio
- **Description**: Subtitle text
- **Theme**: `auto`, `light`, or `dark`
- **Layout**: `grid` or `list` view
- **Footer**: Show/hide footer section

## Repository Structure

When initialized, your TOYBOX repository contains:

```
toybox/
├── src/artifacts/          # Your published artifacts
├── TOYBOX_CONFIG.json      # Site configuration
└── (template files...)     # React app infrastructure
```

## Troubleshooting

### Authentication Issues
```bash
gh auth status              # Check authentication
gh auth login               # Re-authenticate if needed
```

### Build Failures
- Ensure your artifact code is valid React/TypeScript
- Check for syntax errors or missing imports
- Verify all dependencies are available

### Repository Not Found
- Make sure you've run `initialize_toybox` first
- Check that the repository exists on GitHub
- Verify GitHub Pages is enabled

## Contributing

This project is part of the TOYBOX ecosystem. See the main repository for contribution guidelines.

## License

MIT License - see LICENSE file for details.