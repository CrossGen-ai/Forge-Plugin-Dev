#!/bin/bash

# Copy plugin build to .obsidian/plugins directory
# Usage: ./copy-plugin.sh <plugin-name>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Plugin name is required"
    echo "Usage: $0 <plugin-name>"
    echo "Example: $0 task-system"
    echo ""
    echo "This will copy plugins/<plugin-name>/build/* to .obsidian/plugins/<plugin-name>/"
    exit 1
fi

PLUGIN_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE_DIR="$PROJECT_ROOT/plugins/$PLUGIN_NAME/build"
TARGET_DIR="$PROJECT_ROOT/.obsidian/plugins/$PLUGIN_NAME"

# Validate plugin name (kebab-case, alphanumeric and hyphens only)
if [[ ! "$PLUGIN_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "❌ Error: Invalid plugin name format"
    echo "Plugin name must be:"
    echo "- Lowercase letters only"
    echo "- Numbers allowed"
    echo "- Hyphens for word separation"
    echo "- No spaces, underscores, or special characters"
    exit 1
fi

# Check if source plugin exists
if [ ! -d "$PROJECT_ROOT/plugins/$PLUGIN_NAME" ]; then
    echo "❌ Error: Plugin '$PLUGIN_NAME' not found"
    echo "Directory does not exist: $PROJECT_ROOT/plugins/$PLUGIN_NAME"
    echo ""
    echo "Available plugins:"
    find "$PROJECT_ROOT/plugins" -maxdepth 1 -type d -name "*" ! -name "plugins" -exec basename {} \; 2>/dev/null | sort
    exit 1
fi

# Check if build directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Build directory not found: $SOURCE_DIR"
    echo "Make sure to build the plugin first:"
    echo "cd plugins/$PLUGIN_NAME && npm run build"
    exit 1
fi

# Check if build directory has required files
if [ ! -f "$SOURCE_DIR/main.js" ] || [ ! -f "$SOURCE_DIR/manifest.json" ]; then
    echo "❌ Error: Build directory is missing required files"
    echo "Expected files: main.js, manifest.json"
    echo "Found files:"
    ls -la "$SOURCE_DIR"
    echo ""
    echo "Try rebuilding the plugin:"
    echo "cd plugins/$PLUGIN_NAME && npm run build"
    exit 1
fi

# Check if .obsidian/plugins directory exists
if [ ! -d "$PROJECT_ROOT/.obsidian/plugins" ]; then
    echo "❌ Error: .obsidian/plugins directory not found"
    echo "Make sure you're running this script from the Obsidian vault root directory"
    exit 1
fi

echo "📦 Copying plugin '$PLUGIN_NAME' to Obsidian plugins directory..."
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_DIR"

# Create target directory and copy files
if mkdir -p "$TARGET_DIR" && cp -r "$SOURCE_DIR/"* "$TARGET_DIR/" 2>/dev/null; then
    echo "✅ Plugin '$PLUGIN_NAME' copied successfully!"
    echo ""
    echo "Files copied:"
    ls -la "$TARGET_DIR" | grep -v "^total" | tail -n +2 | while read line; do
        filename=$(echo "$line" | awk '{print $NF}')
        echo "  ✓ $filename"
    done
    echo ""
    echo "Next steps:"
    echo "1. Restart Obsidian or reload plugins"
    echo "2. Enable '$PLUGIN_NAME' in Settings → Community Plugins"
    echo ""
    echo "💡 Development tip:"
    echo "   After making code changes, rebuild and copy again:"
    echo "   cd plugins/$PLUGIN_NAME && npm run build && ../../build-support/copy-plugin.sh $PLUGIN_NAME"
else
    echo "❌ Failed to copy plugin files"
    echo "Check permissions and try again"
    exit 1
fi