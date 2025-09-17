#!/bin/bash

# Create new Obsidian plugin from template
# Usage: ./create-plugin.sh <plugin-name>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Plugin name is required"
    echo "Usage: $0 <plugin-name>"
    echo "Example: $0 my-awesome-plugin"
    echo ""
    echo "Plugin name requirements:"
    echo "- Must be lowercase"
    echo "- Use hyphens for word separation"
    echo "- Alphanumeric characters and hyphens only"
    exit 1
fi

PLUGIN_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE_DIR="$PROJECT_ROOT/examples/obsidian-sample-plugin"
TARGET_DIR="$PROJECT_ROOT/plugins/$PLUGIN_NAME"
OBSIDIAN_PLUGINS_DIR="$PROJECT_ROOT/.obsidian/plugins"
SYMLINK_TARGET="$OBSIDIAN_PLUGINS_DIR/$PLUGIN_NAME"

# Validate plugin name (kebab-case, alphanumeric and hyphens only)
if [[ ! "$PLUGIN_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "❌ Error: Invalid plugin name format"
    echo "Plugin name must be:"
    echo "- Lowercase letters only"
    echo "- Numbers allowed"
    echo "- Hyphens for word separation"
    echo "- No spaces, underscores, or special characters"
    echo ""
    echo "Examples:"
    echo "✅ my-awesome-plugin"
    echo "✅ task-manager"
    echo "✅ ai-helper-2024"
    echo "❌ My-Plugin (uppercase)"
    echo "❌ my_plugin (underscore)"
    echo "❌ my plugin (space)"
    exit 1
fi

# Check if template exists
if [ ! -d "$TEMPLATE_DIR" ]; then
    echo "❌ Error: Template directory not found: $TEMPLATE_DIR"
    echo "Make sure the obsidian-sample-plugin template exists in examples/"
    exit 1
fi

# Check if target already exists
if [ -d "$TARGET_DIR" ]; then
    echo "❌ Error: Plugin '$PLUGIN_NAME' already exists"
    echo "Directory already exists: $TARGET_DIR"
    echo ""
    echo "Choose a different plugin name or remove the existing directory:"
    echo "rm -rf $TARGET_DIR"
    exit 1
fi

# Check if .obsidian/plugins directory exists
if [ ! -d "$OBSIDIAN_PLUGINS_DIR" ]; then
    echo "❌ Error: .obsidian/plugins directory not found: $OBSIDIAN_PLUGINS_DIR"
    echo "Make sure you're running this script from the Obsidian vault root directory"
    exit 1
fi

# Check if plugin target already exists
if [ -e "$SYMLINK_TARGET" ]; then
    echo "❌ Error: Plugin '$PLUGIN_NAME' already exists in .obsidian/plugins"
    echo "File/directory already exists: $SYMLINK_TARGET"
    echo ""
    echo "Choose a different plugin name or remove the existing entry:"
    echo "rm -rf $SYMLINK_TARGET"
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
mkdir -p "$TARGET_DIR/build"

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

# Update esbuild.config.mjs to point to src/main.ts and output to build/
perl -i -pe 's|entryPoints: \["main\.ts"\]|entryPoints: ["src/main.ts"]|g' "$TARGET_DIR/esbuild.config.mjs"
perl -i -pe 's|outfile: "main\.js"|outfile: "build/main.js"|g' "$TARGET_DIR/esbuild.config.mjs"

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

# Install dependencies and build
echo ""
echo "📦 Installing dependencies..."
cd "$TARGET_DIR"
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
    echo ""
    echo "🔨 Building plugin..."
    npm run build

    if [ $? -eq 0 ]; then
        echo "✅ Plugin built successfully"
        echo ""
        echo "📦 Copying plugin files to build folder..."

        # Copy manifest.json to build folder
        cp "$TARGET_DIR/manifest.json" "$TARGET_DIR/build/"

        # Copy styles.css if it exists
        if [ -f "$TARGET_DIR/styles.css" ]; then
            cp "$TARGET_DIR/styles.css" "$TARGET_DIR/build/"
            echo "✓ Copied styles.css"
        fi

        # Copy versions.json if it exists
        if [ -f "$TARGET_DIR/versions.json" ]; then
            cp "$TARGET_DIR/versions.json" "$TARGET_DIR/build/"
            echo "✓ Copied versions.json"
        fi

        echo "✓ Copied manifest.json"
        echo "✓ Build folder ready with all required files"
        echo ""
        echo "📦 Copying plugin to Obsidian plugins directory..."

        # Copy build folder contents to .obsidian/plugins directory
        cd "$PROJECT_ROOT"
        if mkdir -p "$SYMLINK_TARGET" && cp -r "plugins/$PLUGIN_NAME/build/"* "$SYMLINK_TARGET/" 2>/dev/null; then
            echo "✅ Plugin copied: .obsidian/plugins/$PLUGIN_NAME"
            echo ""
            echo "✅ Plugin '$PLUGIN_NAME' created and ready for use!"
            echo ""
            echo "Next steps:"
            echo "1. cd plugins/$PLUGIN_NAME"
            echo "2. npm run dev (for development with watch mode)"
            echo "3. Edit src/main.ts to implement your plugin"
            echo "4. Enable the plugin in Obsidian Settings → Community Plugins"
            echo "5. After making changes, run: cp -r plugins/$PLUGIN_NAME/build/* .obsidian/plugins/$PLUGIN_NAME/"
            echo ""
            echo "Ready for development! The plugin has been:"
            echo "✓ Created with proper folder structure"
            echo "✓ Dependencies installed"
            echo "✓ Built successfully (build/main.js created)"
            echo "✓ All plugin files copied to build/ folder"
            echo "✓ Copied to .obsidian/plugins for immediate use"
        else
            echo "⚠️  Warning: Could not copy plugin to .obsidian/plugins"
            echo "   You can manually copy the plugin files:"
            echo "   mkdir -p .obsidian/plugins/$PLUGIN_NAME && cp -r plugins/$PLUGIN_NAME/build/* .obsidian/plugins/$PLUGIN_NAME/"
            echo ""
            echo "✅ Plugin '$PLUGIN_NAME' created and built successfully!"
            echo ""
            echo "Next steps:"
            echo "1. cd plugins/$PLUGIN_NAME"
            echo "2. npm run dev (for development with watch mode)"
            echo "3. Edit src/main.ts to implement your plugin"
            echo "4. Copy build folder to .obsidian/plugins/$PLUGIN_NAME"
            echo ""
            echo "Ready for development! The plugin has been:"
            echo "✓ Created with proper folder structure"
            echo "✓ Dependencies installed"
            echo "✓ Built successfully (build/main.js created)"
        fi
    else
        echo "❌ Build failed. You may need to fix TypeScript errors before continuing."
        echo ""
        echo "Next steps:"
        echo "1. cd plugins/$PLUGIN_NAME"
        echo "2. Fix any TypeScript errors in src/main.ts"
        echo "3. npm run build"
        echo "4. npm run dev"
    fi
else
    echo "❌ npm install failed. Please check your Node.js installation and network connection."
    echo ""
    echo "Manual steps required:"
    echo "1. cd plugins/$PLUGIN_NAME"
    echo "2. npm install"
    echo "3. npm run build"
    echo "4. npm run dev"
fi

# Return to original directory
cd "$PROJECT_ROOT"

echo ""
echo "Plugin structure created with:"
echo "- docs/ - Documentation files"
echo "- plugin-agents/ - Claude Code agents"
echo "- plugin-commands/ - Claude Code commands"
echo "- tests/ - Test files"
echo "- src/ - Source code (main.ts moved here)"
echo "- build/ - Build output folder (main.js, manifest.json, styles.css)"
echo ""
echo "Files updated:"
echo "- manifest.json (id, name, description, author fields cleared)"
echo "- package.json (name, description)"
echo "- esbuild.config.mjs (entry point to src/main.ts, output to build/main.js)"
echo "- tsconfig.json (include src/**/*)"
echo "- README.md (title, description)"
echo ""
echo "Build process:"
echo "- Compiled TypeScript to build/main.js"
echo "- Copied manifest.json to build/ folder"
echo "- Copied styles.css to build/ folder (if exists)"
echo "- Copied versions.json to build/ folder (if exists)"
echo "- Copied build files to: .obsidian/plugins/$PLUGIN_NAME"
echo ""