#!/bin/bash

# Create new Obsidian plugin from template
# Usage: ./create-plugin.sh <plugin-name>

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <plugin-name>"
    echo "Example: $0 my-awesome-plugin"
    exit 1
fi

PLUGIN_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE_DIR="$PROJECT_ROOT/examples/obsidian-sample-plugin"
TARGET_DIR="$PROJECT_ROOT/plugins/$PLUGIN_NAME"

# Validate plugin name (kebab-case, alphanumeric and hyphens only)
if [[ ! "$PLUGIN_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "Error: Plugin name must be lowercase, alphanumeric, and hyphens only (kebab-case)"
    exit 1
fi

# Check if template exists
if [ ! -d "$TEMPLATE_DIR" ]; then
    echo "Error: Template directory not found: $TEMPLATE_DIR"
    exit 1
fi

# Check if target already exists
if [ -d "$TARGET_DIR" ]; then
    echo "Error: Plugin directory already exists: $TARGET_DIR"
    exit 1
fi

echo "Creating new plugin: $PLUGIN_NAME"
echo "Template: $TEMPLATE_DIR"
echo "Target: $TARGET_DIR"

# Copy template to target location
cp -r "$TEMPLATE_DIR" "$TARGET_DIR"

# Remove git history from copied plugin
rm -rf "$TARGET_DIR/.git"

# Create plugin folder structure per CLAUDE.md conventions
mkdir -p "$TARGET_DIR/docs"
mkdir -p "$TARGET_DIR/plugin-agents"
mkdir -p "$TARGET_DIR/plugin-commands"
mkdir -p "$TARGET_DIR/tests"
mkdir -p "$TARGET_DIR/src"

# Move main.ts to src/ folder
if [ -f "$TARGET_DIR/main.ts" ]; then
    mv "$TARGET_DIR/main.ts" "$TARGET_DIR/src/"
fi

# Convert plugin name to different formats
PLUGIN_ID="$PLUGIN_NAME"
PLUGIN_TITLE=$(echo "$PLUGIN_NAME" | sed 's/-/ /g' | sed 's/\b\w/\U&/g')
PLUGIN_DESCRIPTION="A new Obsidian plugin: $PLUGIN_TITLE"

echo "Plugin ID: $PLUGIN_ID"
echo "Plugin Title: $PLUGIN_TITLE"
echo "Plugin Description: $PLUGIN_DESCRIPTION"

# Update manifest.json with perl for better string handling
perl -i -pe "s/sample-plugin/$PLUGIN_ID/g" "$TARGET_DIR/manifest.json"
perl -i -pe "s/Sample Plugin/$PLUGIN_TITLE/g" "$TARGET_DIR/manifest.json"
perl -i -pe "s/Demonstrates some of the capabilities of the Obsidian API./$PLUGIN_DESCRIPTION/g" "$TARGET_DIR/manifest.json"
perl -i -pe 's/"Obsidian"/""/g' "$TARGET_DIR/manifest.json"
perl -i -pe 's|"https://obsidian.md"|""|g' "$TARGET_DIR/manifest.json"
perl -i -pe 's|"https://obsidian.md/pricing"|""|g' "$TARGET_DIR/manifest.json"

# Update package.json
perl -i -pe "s/obsidian-sample-plugin/$PLUGIN_ID/g" "$TARGET_DIR/package.json"
perl -i -pe "s/This is a sample plugin for Obsidian \\(https:\\/\\/obsidian\\.md\\)/$PLUGIN_DESCRIPTION/g" "$TARGET_DIR/package.json"

# Update esbuild.config.mjs to point to src/main.ts
sed -i '' \
    -e "s|entryPoints: \['main.ts'\]|entryPoints: ['src/main.ts']|" \
    "$TARGET_DIR/esbuild.config.mjs"

# Update tsconfig.json include path
sed -i '' \
    -e 's|"include": \["main.ts"\]|"include": ["src/**/*"]|' \
    "$TARGET_DIR/tsconfig.json"

# Create basic documentation files
cat > "$TARGET_DIR/docs/$PLUGIN_NAME.PRD.md" << EOF
# $PLUGIN_TITLE - Product Requirements Document

## Overview
$PLUGIN_DESCRIPTION

## Features
- [ ] Feature 1
- [ ] Feature 2

## Implementation Notes
TBD

## Testing Plan
TBD
EOF

cat > "$TARGET_DIR/plugin-commands/$PLUGIN_NAME.context-prime.md" << EOF
# $PLUGIN_TITLE Context Prime

This command provides context for working with the $PLUGIN_TITLE plugin.

## Plugin Overview
$PLUGIN_DESCRIPTION

## Key Files
- \`src/main.ts\` - Main plugin entry point
- \`manifest.json\` - Plugin metadata
- \`package.json\` - npm configuration

## Development Commands
- \`npm install\` - Install dependencies
- \`npm run dev\` - Development build with watch
- \`npm run build\` - Production build
EOF

cat > "$TARGET_DIR/plugin-commands/$PLUGIN_NAME.update.md" << EOF
# Update $PLUGIN_TITLE

Command for making updates to the $PLUGIN_TITLE plugin.

## Update Process
1. Make code changes in \`src/\` directory
2. Test changes with \`npm run dev\`
3. Build for production with \`npm run build\`
4. Update version in manifest.json and package.json
5. Update CHANGELOG.md if it exists

## Key Considerations
- Follow Obsidian plugin guidelines
- Maintain backward compatibility
- Test on both desktop and mobile if not desktop-only
EOF

# Update README.md with new plugin info
sed -i '' \
    -e "s/# Obsidian Sample Plugin/# $PLUGIN_TITLE/" \
    -e "s/This is a sample plugin for Obsidian (https:\/\/obsidian.md)\./$PLUGIN_DESCRIPTION/" \
    "$TARGET_DIR/README.md"

echo ""
echo "✅ Plugin '$PLUGIN_NAME' created successfully!"
echo ""
echo "Next steps:"
echo "1. cd plugins/$PLUGIN_NAME"
echo "2. npm install"
echo "3. npm run dev"
echo "4. Edit src/main.ts to implement your plugin"
echo ""
echo "Plugin structure created with:"
echo "- docs/ - Documentation files"
echo "- plugin-agents/ - Claude Code agents"
echo "- plugin-commands/ - Claude Code commands"
echo "- tests/ - Test files"
echo "- src/ - Source code (main.ts moved here)"
echo ""
echo "Files updated:"
echo "- manifest.json (id, name, description, author fields cleared)"
echo "- package.json (name, description)"
echo "- esbuild.config.mjs (entry point to src/main.ts)"
echo "- tsconfig.json (include src/**/*)"
echo "- README.md (title, description)"
echo ""