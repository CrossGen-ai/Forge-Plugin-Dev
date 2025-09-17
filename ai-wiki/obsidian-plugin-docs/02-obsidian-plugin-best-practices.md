# Obsidian Plugin Development Best Practices

Comprehensive guide to best practices, coding patterns, and conventions for Obsidian plugin development.

## Table of Contents
- [Project Setup](#project-setup)
- [TypeScript Best Practices](#typescript-best-practices)
- [Plugin Architecture](#plugin-architecture)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)
- [Security Guidelines](#security-guidelines)
- [User Experience](#user-experience)
- [Testing & Quality](#testing--quality)
- [Distribution & Maintenance](#distribution--maintenance)

## Project Setup

### Development Environment
- **Node.js**: Use Node.js v16+ for compatibility
- **TypeScript**: Enable strict mode for type safety
- **ESLint**: Configure for code quality enforcement
- **Build Tools**: Use esbuild for fast compilation

### Project Structure (for plugin - there may be other documetnation folders by the user)
```
my-plugin/
├── src/
│   ├── main.ts           # Plugin entry point
│   ├── settings.ts       # Settings management
│   ├── views/           # Custom views
│   ├── modals/          # Modal dialogs
│   └── utils/           # Utility functions
├── styles.css           # Plugin styles
├── manifest.json        # Plugin metadata
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── esbuild.config.mjs   # Build configuration
└── README.md           # Documentation
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## TypeScript Best Practices

### 1. Strict Type Safety
**Always use strict TypeScript configuration:**

```typescript
// ✅ Good: Strong typing
interface PluginSettings {
    apiKey: string;
    enableFeature: boolean;
    threshold: number;
}

// ❌ Avoid: Using 'any'
let settings: any = { /* ... */ };

// ✅ Good: Specific return types
async function fetchData(): Promise<string | null> {
    try {
        const response = await requestUrl('https://api.example.com');
        return response.text;
    } catch (error) {
        console.error('Fetch failed:', error);
        return null;
    }
}
```

### 2. Modern Async/Await Patterns
```typescript
// ✅ Good: async/await
async function processFile(file: TFile): Promise<void> {
    try {
        const content = await this.app.vault.read(file);
        const processed = await this.processContent(content);
        await this.app.vault.modify(file, processed);
    } catch (error) {
        new Notice(`Failed to process ${file.name}: ${error.message}`);
        throw error;
    }
}

// ❌ Avoid: Promise chains
function processFileOld(file: TFile): Promise<void> {
    return this.app.vault.read(file)
        .then(content => this.processContent(content))
        .then(processed => this.app.vault.modify(file, processed))
        .catch(error => {
            new Notice(`Failed to process ${file.name}: ${error.message}`);
            throw error;
        });
}
```

### 3. Template Literal Types
```typescript
// ✅ Good: Template literal types for string patterns
type EventName = `${string}:${string}`;
type PluginId = `${string}-${string}`;

function registerEvent(name: EventName, callback: Function) {
    // Ensures event names follow pattern like "vault:created"
}
```

### 4. Interface Design
```typescript
// ✅ Good: Well-defined interfaces
interface FileProcessor {
    readonly supportedExtensions: readonly string[];
    canProcess(file: TFile): boolean;
    process(file: TFile, content: string): Promise<string>;
}

class MarkdownProcessor implements FileProcessor {
    readonly supportedExtensions = ['md', 'markdown'] as const;

    canProcess(file: TFile): boolean {
        return this.supportedExtensions.includes(file.extension as any);
    }

    async process(file: TFile, content: string): Promise<string> {
        // Implementation
        return content;
    }
}
```

## Plugin Architecture

### 1. Modular Design
```typescript
// ✅ Good: Modular architecture
export default class MyPlugin extends Plugin {
    private settingsManager: SettingsManager;
    private commandManager: CommandManager;
    private viewManager: ViewManager;

    async onload() {
        // Initialize managers
        this.settingsManager = new SettingsManager(this);
        this.commandManager = new CommandManager(this);
        this.viewManager = new ViewManager(this);

        // Load components
        await this.settingsManager.load();
        this.commandManager.registerCommands();
        this.viewManager.registerViews();
    }

    async onunload() {
        // Cleanup is automatic for registered components
    }
}
```

### 2. Settings Management
```typescript
export class SettingsManager {
    private plugin: MyPlugin;
    private settings: MyPluginSettings;

    constructor(plugin: MyPlugin) {
        this.plugin = plugin;
    }

    async load(): Promise<void> {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.plugin.loadData()
        );
    }

    async save(): Promise<void> {
        await this.plugin.saveData(this.settings);
    }

    get<K extends keyof MyPluginSettings>(key: K): MyPluginSettings[K] {
        return this.settings[key];
    }

    async set<K extends keyof MyPluginSettings>(
        key: K,
        value: MyPluginSettings[K]
    ): Promise<void> {
        this.settings[key] = value;
        await this.save();
    }
}
```

### 3. Command Registration
```typescript
export class CommandManager {
    private plugin: MyPlugin;

    constructor(plugin: MyPlugin) {
        this.plugin = plugin;
    }

    registerCommands(): void {
        // Group related commands
        this.registerFileCommands();
        this.registerViewCommands();
    }

    private registerFileCommands(): void {
        this.plugin.addCommand({
            id: 'process-current-file',
            name: 'Process Current File',
            checkCallback: (checking: boolean) => {
                const file = this.plugin.app.workspace.getActiveFile();
                if (!file) return false;

                if (!checking) {
                    this.processFile(file);
                }
                return true;
            }
        });
    }

    private async processFile(file: TFile): Promise<void> {
        // Implementation
    }
}
```

## Performance Optimization

### 1. Efficient Event Handling
```typescript
// ✅ Good: Debounced file modifications
class FileWatcher {
    private debounceTimer: number | null = null;
    private readonly DEBOUNCE_DELAY = 300;

    constructor(private plugin: MyPlugin) {
        this.registerEvents();
    }

    private registerEvents(): void {
        this.plugin.registerEvent(
            this.plugin.app.vault.on('modify', (file) => {
                this.debouncedOnModify(file);
            })
        );
    }

    private debouncedOnModify(file: TFile): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = window.setTimeout(() => {
            this.onFileModified(file);
            this.debounceTimer = null;
        }, this.DEBOUNCE_DELAY);
    }

    private onFileModified(file: TFile): void {
        // Actual processing logic
    }
}
```

### 2. Lazy Loading
```typescript
// ✅ Good: Lazy initialization
export class ExpensiveFeature {
    private static instance: ExpensiveFeature | null = null;
    private initialized = false;

    static getInstance(): ExpensiveFeature {
        if (!this.instance) {
            this.instance = new ExpensiveFeature();
        }
        return this.instance;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        // Expensive initialization
        await this.loadLargeDataset();
        this.initialized = true;
    }

    private async loadLargeDataset(): Promise<void> {
        // Heavy operations
    }
}
```

### 3. Memory Management
```typescript
// ✅ Good: Proper cleanup
export class DataCache {
    private cache = new Map<string, any>();
    private cleanupInterval: number;

    constructor() {
        // Periodic cleanup
        this.cleanupInterval = window.setInterval(() => {
            this.cleanup();
        }, 60000); // Every minute
    }

    destroy(): void {
        this.cache.clear();
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }

    private cleanup(): void {
        // Remove stale entries
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > 300000) { // 5 minutes
                this.cache.delete(key);
            }
        }
    }
}
```

## Error Handling

### 1. Comprehensive Error Handling
```typescript
// ✅ Good: Proper error handling
export class SafeFileProcessor {
    async processFile(file: TFile): Promise<boolean> {
        try {
            await this.validateFile(file);
            const content = await this.readFile(file);
            const processed = await this.transform(content);
            await this.writeFile(file, processed);
            return true;
        } catch (error) {
            if (error instanceof ValidationError) {
                new Notice(`Invalid file: ${error.message}`);
            } else if (error instanceof ProcessingError) {
                new Notice(`Processing failed: ${error.message}`);
                console.error('Processing error:', error);
            } else {
                new Notice(`Unexpected error: ${error.message}`);
                console.error('Unexpected error:', error);
            }
            return false;
        }
    }

    private async validateFile(file: TFile): Promise<void> {
        if (!file.extension.match(/^(md|txt)$/)) {
            throw new ValidationError(`Unsupported file type: ${file.extension}`);
        }
    }
}

class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

class ProcessingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ProcessingError';
    }
}
```

### 2. Graceful Degradation
```typescript
// ✅ Good: Fallback mechanisms
export class RobustApiClient {
    private readonly fallbackDelay = 1000;
    private readonly maxRetries = 3;

    async fetchData(url: string): Promise<any> {
        let lastError: Error;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await requestUrl(url);
                return response.json;
            } catch (error) {
                lastError = error;

                if (attempt < this.maxRetries) {
                    await this.delay(this.fallbackDelay * attempt);
                    continue;
                }
            }
        }

        // Final fallback
        new Notice('API unavailable, using cached data');
        return this.getCachedData();
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getCachedData(): any {
        // Return cached or default data
        return {};
    }
}
```

## Security Guidelines

### 1. Input Validation
```typescript
// ✅ Good: Input sanitization
export class SecureInputHandler {
    validateFileName(name: string): string {
        // Remove dangerous characters
        const sanitized = name.replace(/[<>:"/\\|?*]/g, '-');

        // Limit length
        const truncated = sanitized.substring(0, 100);

        // Ensure not empty
        return truncated || 'untitled';
    }

    validateUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }

    sanitizeHtml(input: string): string {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
}
```

### 2. Secure API Handling
```typescript
// ✅ Good: Secure API key management
export class SecureApiManager {
    private getApiKey(): string | null {
        // Never log or expose API keys
        const key = this.plugin.settings.apiKey;
        return key || null;
    }

    async makeRequest(endpoint: string, data: any): Promise<any> {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        // Use secure headers
        const response = await requestUrl({
            url: endpoint,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': `ObsidianPlugin/${this.plugin.manifest.version}`
            },
            body: JSON.stringify(data)
        });

        return response.json;
    }
}
```

## User Experience

### 1. Progressive Enhancement
```typescript
// ✅ Good: Feature detection
export class ProgressiveFeature {
    private isSupported(): boolean {
        return 'IntersectionObserver' in window;
    }

    enable(): void {
        if (this.isSupported()) {
            this.enableAdvancedFeature();
        } else {
            this.enableBasicFeature();
            new Notice('Using basic mode - update browser for enhanced features');
        }
    }

    private enableAdvancedFeature(): void {
        // Use modern APIs
    }

    private enableBasicFeature(): void {
        // Fallback implementation
    }
}
```

### 2. Responsive UI
```typescript
// ✅ Good: Responsive modals
export class ResponsiveModal extends Modal {
    onOpen(): void {
        const { contentEl } = this;

        // Responsive container
        contentEl.addClass('responsive-modal');

        // Mobile detection
        if (Platform.isMobile) {
            contentEl.addClass('mobile-layout');
        }

        this.buildContent();
    }

    private buildContent(): void {
        const container = this.contentEl.createDiv('modal-content');

        // Responsive layout
        const header = container.createDiv('modal-header');
        const body = container.createDiv('modal-body');
        const footer = container.createDiv('modal-footer');

        // Add content...
    }
}
```

### 3. Accessibility
```typescript
// ✅ Good: Accessible components
export class AccessibleButton {
    create(container: HTMLElement, text: string, onClick: () => void): HTMLButtonElement {
        const button = container.createEl('button', {
            text,
            attr: {
                'aria-label': text,
                'role': 'button',
                'tabindex': '0'
            }
        });

        // Keyboard support
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
            }
        });

        button.addEventListener('click', onClick);

        return button;
    }
}
```

## Testing & Quality

### 1. ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### 2. Code Documentation
```typescript
/**
 * Processes markdown files and applies transformations
 * @param file - The file to process
 * @param options - Processing options
 * @returns Promise resolving to processing result
 * @throws {ValidationError} When file format is invalid
 * @throws {ProcessingError} When transformation fails
 */
export async function processMarkdownFile(
    file: TFile,
    options: ProcessingOptions
): Promise<ProcessingResult> {
    // Implementation
}

interface ProcessingOptions {
    /** Whether to backup original file */
    createBackup?: boolean;
    /** Maximum processing time in milliseconds */
    timeout?: number;
}

interface ProcessingResult {
    /** Whether processing was successful */
    success: boolean;
    /** Number of changes made */
    changeCount: number;
    /** Processing duration in milliseconds */
    duration: number;
}
```

## Distribution & Maintenance

### 1. Version Management
```json
{
  "scripts": {
    "version:patch": "npm version patch && node version-bump.mjs",
    "version:minor": "npm version minor && node version-bump.mjs",
    "version:major": "npm version major && node version-bump.mjs",
    "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
    "dev": "node esbuild.config.mjs",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src"
  }
}
```

### 2. Manifest Best Practices
```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "minAppVersion": "0.15.0",
  "description": "Clear, concise description of plugin functionality",
  "author": "Your Name",
  "authorUrl": "https://your-website.com",
  "fundingUrl": "https://funding-platform.com/yourplugin",
  "isDesktopOnly": false
}
```

### 3. Changelog Maintenance
```markdown
# Changelog

## [1.2.0] - 2024-01-15
### Added
- New feature X with improved performance
- Command palette integration

### Fixed
- Bug with file processing on mobile
- Memory leak in event handlers

### Changed
- Updated API to use latest Obsidian methods
- Improved error messages

## [1.1.0] - 2024-01-01
### Added
- Initial release with core functionality
```

## Plugin Guidelines Checklist

- [ ] **Type Safety**: Use strict TypeScript, avoid `any`
- [ ] **Error Handling**: Comprehensive try/catch with user feedback
- [ ] **Performance**: Debounce events, lazy loading, memory cleanup
- [ ] **Security**: Validate inputs, secure API handling
- [ ] **Accessibility**: Keyboard navigation, ARIA labels
- [ ] **Mobile Support**: Test on mobile, responsive design
- [ ] **Documentation**: JSDoc comments, clear README
- [ ] **Testing**: ESLint clean, manual testing
- [ ] **Versioning**: Semantic versioning, changelog updates
- [ ] **Distribution**: Proper manifest, funding info