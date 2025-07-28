# TOYBOX Template Directory

This directory contains the local template files used in debug mode for TOYBOX initialization.

## Purpose

When running in debug mode (`debug: true`), the MCP server will copy files from this directory instead of cloning from a GitHub template repository. This is useful for:

1. Local development and testing
2. Working without internet connectivity
3. Testing template changes before pushing to GitHub

## Setup

To use debug mode, you need to populate this directory with the TOYBOX template files. You have two options:

### Option 1: Copy from Main Repository
```bash
# From the root of the toybox repository
cp -r ./* toybox-mcp-server/template/
# Remove unnecessary files
rm -rf toybox-mcp-server/template/toybox-mcp-server
rm -rf toybox-mcp-server/template/.git
```

### Option 2: Clone the Template Repository
```bash
# Clone the official template
git clone https://github.com/TEMPLATE_OWNER/toybox toybox-mcp-server/template
# Remove git directory
rm -rf toybox-mcp-server/template/.git
```

## Usage

When initializing a TOYBOX in debug mode:

```javascript
initialize_toybox({
  repoName: "my-toybox",
  templateOwner: "ignored-in-debug",
  templateRepo: "ignored-in-debug",
  debug: true,
  // Optional: specify a different template path
  localTemplatePath: "/path/to/custom/template"
})
```

## Files to Include

The template should include at minimum:
- `package.json`
- `vite.config.ts`
- `index.html`
- `tsconfig.json` and related TypeScript configs
- `tailwind.config.mjs` for Tailwind CSS configuration
- `postcss.config.js` for PostCSS processing
- `src/` directory with all source files
- `public/` directory with static assets
- `.github/workflows/` for deployment
- `TOYBOX_CONFIG.json` for configuration
- `components.json` for shadcn/ui configuration
- Any other files needed for a functional TOYBOX site