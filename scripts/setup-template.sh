#\!/bin/bash

# Script to set up the local template directory for debug mode

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_SERVER_DIR="$(dirname "$SCRIPT_DIR")"
TOYBOX_ROOT="$(dirname "$MCP_SERVER_DIR")"
TEMPLATE_DIR="$MCP_SERVER_DIR/template"

echo "Setting up TOYBOX template for debug mode..."
echo "Source: $TOYBOX_ROOT"
echo "Destination: $TEMPLATE_DIR"

# Create template directory if it doesn't exist
mkdir -p "$TEMPLATE_DIR"

# Copy necessary files and directories
echo "Copying template files..."

# Files to copy
FILES=(
  "package.json"
  "package-lock.json"
  "vite.config.ts"
  "index.html"
  "tsconfig.json"
  "tsconfig.app.json"
  "tsconfig.node.json"
  "eslint.config.js"
  "postcss.config.js"
  "tailwind.config.mjs"
  "TOYBOX_CONFIG.json"
  "components.json"
  ".gitignore"
)

# Directories to copy
DIRS=(
  "src"
  "public"
  ".github"
)

# Copy files
for file in "${FILES[@]}"; do
  if [ -f "$TOYBOX_ROOT/$file" ]; then
    cp "$TOYBOX_ROOT/$file" "$TEMPLATE_DIR/"
    echo "  ✓ $file"
  else
    echo "  ⚠ $file not found"
  fi
done

# Copy directories
for dir in "${DIRS[@]}"; do
  if [ -d "$TOYBOX_ROOT/$dir" ]; then
    cp -r "$TOYBOX_ROOT/$dir" "$TEMPLATE_DIR/"
    echo "  ✓ $dir/"
  else
    echo "  ⚠ $dir/ not found"
  fi
done

# Remove toybox-mcp-server directory if it was accidentally copied
if [ -d "$TEMPLATE_DIR/toybox-mcp-server" ]; then
  rm -rf "$TEMPLATE_DIR/toybox-mcp-server"
  echo "  ✓ Removed toybox-mcp-server from template"
fi

# Remove node_modules if it exists
if [ -d "$TEMPLATE_DIR/node_modules" ]; then
  rm -rf "$TEMPLATE_DIR/node_modules"
  echo "  ✓ Removed node_modules from template"
fi

# Remove .git if it exists
if [ -d "$TEMPLATE_DIR/.git" ]; then
  rm -rf "$TEMPLATE_DIR/.git"
  echo "  ✓ Removed .git from template"
fi

echo ""
echo "✅ Template setup complete\!"
echo ""
echo "You can now use debug mode by setting debug: true when initializing a TOYBOX."
