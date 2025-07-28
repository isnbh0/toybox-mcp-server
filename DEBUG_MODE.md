# Debug Mode for TOYBOX MCP Server

The TOYBOX MCP Server now supports a debug mode that allows you to initialize TOYBOX repositories using local template files instead of cloning from GitHub. This is particularly useful for development and testing.

## Features

- **Local Template**: Uses files from the local filesystem instead of GitHub
- **No GitHub Dependency**: Works without internet connection or GitHub authentication  
- **Faster Development**: No need to push template changes to GitHub for testing
- **Customizable**: Can specify custom template paths

## Setup

### 1. Populate the Template Directory

Run the setup script to copy the current TOYBOX files to the template directory:

```bash
./toybox-mcp-server/scripts/setup-template.sh
```

This will copy all necessary files from the main TOYBOX repository to `toybox-mcp-server/template/`.

### 2. Verify Template Contents

The template directory should contain:
- `package.json` and related config files
- `src/` directory with all source code
- `public/` directory with static assets
- `.github/workflows/` for deployment automation
- `TOYBOX_CONFIG.json` for configuration

## Usage

### Basic Debug Mode

Initialize a TOYBOX using the built-in template:

```javascript
initialize_toybox({
  repoName: "my-debug-toybox",
  templateOwner: "ignored-in-debug-mode",
  debug: true
})
```

### Custom Template Path

Use a custom template directory:

```javascript
initialize_toybox({
  repoName: "my-debug-toybox", 
  templateOwner: "ignored-in-debug-mode",
  debug: true,
  localTemplatePath: "/path/to/custom/template"
})
```

## What Happens in Debug Mode

1. **Skips GitHub Authentication**: No need for `gh auth login`
2. **Copies Local Files**: Files are copied from the template directory
3. **Initializes Git**: Creates a new git repository locally
4. **No Remote Operations**: No GitHub repository creation or Pages setup
5. **Local Development**: Points to `http://localhost:5173/` for the published URL

## Development Workflow

1. Make changes to the main TOYBOX repository
2. Run `./toybox-mcp-server/scripts/setup-template.sh` to update the template
3. Test initialization with `debug: true`
4. The new repository will be created in `~/your-repo-name/`
5. Run `npm run dev` in the new repository to test locally

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `debug` | boolean | No | Enable debug mode (default: false) |
| `localTemplatePath` | string | No | Custom template path (default: built-in template) |
| `templateOwner` | string | Yes* | Ignored in debug mode but still required by schema |

*Note: `templateOwner` is still required due to the schema, but it's ignored when `debug: true`.

## Limitations

- No GitHub Pages deployment in debug mode
- No remote repository creation
- Manual git remote setup required if you want to push later
- Development URL assumes Vite dev server on port 5173

## Troubleshooting

### Template Validation Errors

If you get template validation errors, ensure your template directory contains:
- `package.json`
- `vite.config.ts`
- `index.html`
- `src/` directory
- `TOYBOX_CONFIG.json`

### Missing Files

Run the setup script again to refresh the template:
```bash
./toybox-mcp-server/scripts/setup-template.sh
```

### Permission Errors

Make sure the setup script is executable:
```bash
chmod +x toybox-mcp-server/scripts/setup-template.sh
```