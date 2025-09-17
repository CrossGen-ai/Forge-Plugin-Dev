# Update task system

Command for making updates to the task system plugin.

## Update Process
1. Make code changes in `src/` directory
2. Test changes with `npm run dev`
3. Build for production with `npm run build`
4. Update version in manifest.json and package.json
5. Update CHANGELOG.md if it exists

## Key Considerations
- Follow Obsidian plugin guidelines
- Maintain backward compatibility
- Test on both desktop and mobile if not desktop-only
