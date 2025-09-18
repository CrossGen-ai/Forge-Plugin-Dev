# Plugin Implementation Plan: Atomic Task Schema Enforcer
UUID: 0deaca4e
Date: 2025-09-17

## Executive Summary

This plan details the implementation of the Atomic Task Schema Enforcer plugin for Obsidian. The plugin will enforce frontmatter schema for files marked with `atomic-task: true`, providing real-time validation, auto-population of missing fields, and user-friendly warnings. The implementation will transform the current template codebase into a fully functional schema enforcement system.

**Key Features:**
- Real-time frontmatter validation for atomic task notes
- Auto-population of missing required fields (created_date, title)
- Non-blocking warning system for schema violations
- Configurable schema through plugin settings
- File monitoring for immediate validation on changes

## High-Level Architecture

### Core Components

1. **Schema System** (`src/schema/`)
   - Schema definition and validation engine
   - Type checking for strings, dates, booleans, and lists
   - Default value assignment logic

2. **Frontmatter Handler** (`src/frontmatter/`)
   - YAML parsing and writing utilities
   - Safe markdown file manipulation
   - Error handling for malformed YAML

3. **File Monitor** (`src/events/`)
   - Vault event listeners for file changes
   - Atomic note detection logic
   - Real-time validation triggers

4. **Settings System** (`src/settings/`)
   - User configuration interface
   - Schema customization options
   - Validation mode controls

5. **User Interface** (`src/ui/`)
   - Warning notifications
   - Status indicators
   - Schema violation reporting

### Data Flow

```
File Change → Event Detection → Atomic Note Check → Schema Validation → Auto-populate → User Notification
```

## Implementation Tasks

### Phase 1: Foundation Setup

#### Task 1: Project Structure Initialization
**Priority**: High
**Dependencies**: None
**Description**: Transform template code to task-specific implementation and set up modular file structure

**Pseudocode**:
```typescript
// Rename template classes and interfaces
interface TaskSystemSettings {
    enableValidation: boolean;
    autoPopulateDefaults: boolean;
    validationMode: 'warn' | 'strict';
    defaultStatus: TaskStatus;
    defaultPriority: Priority;
    dateFormat: string;
}

export default class TaskSystemPlugin extends Plugin {
    settings: TaskSystemSettings;

    async onload() {
        // Initialize core systems
        await this.loadSettings();
        this.initializeEventHandlers();
        this.setupCommands();
        this.addSettingTab(new TaskSystemSettingTab(this.app, this));
    }
}
```

#### Task 2: Add YAML Processing Dependencies
**Priority**: High
**Dependencies**: Task 1
**Description**: Install and configure js-yaml for frontmatter parsing

**Pseudocode**:
```bash
# Add to package.json dependencies
npm install js-yaml@^4.1.0
npm install --save-dev @types/js-yaml@^4.0.5
```

#### Task 3: Schema Definition Implementation
**Priority**: High
**Dependencies**: Task 2
**Description**: Create TypeScript interfaces for atomic task schema

**Pseudocode**:
```typescript
// src/schema/schema.definition.ts
export interface AtomicTaskSchema {
    atomic-task: boolean;        // Required
    title: string;              // Required
    created_date: string;       // Required (ISO date)
    status: TaskStatus;         // Required
    priority?: Priority;        // Optional
    due_date?: string;         // Optional (ISO date)
    tags?: string[];           // Optional
    dependencies?: string[];    // Optional
    completed_date?: string;   // Optional (ISO date)
}

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export const REQUIRED_FIELDS = ['atomic-task', 'title', 'created_date', 'status'];
export const DEFAULT_VALUES = {
    status: 'todo',
    priority: 'medium',
    tags: [],
    dependencies: []
};
```

### Phase 2: Core Functionality

#### Task 4: Frontmatter Reader Implementation
**Priority**: High
**Dependencies**: Task 3
**Description**: Create utilities to safely read and parse frontmatter from markdown files

**Pseudocode**:
```typescript
// src/frontmatter/frontmatter.reader.ts
import * as yaml from 'js-yaml';

export class FrontmatterReader {
    static async readFrontmatter(file: TFile): Promise<Record<string, any> | null> {
        try {
            const content = await this.app.vault.read(file);
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

            if (!frontmatterMatch) return null;

            return yaml.load(frontmatterMatch[1]) as Record<string, any>;
        } catch (error) {
            console.error('Failed to read frontmatter:', error);
            return null;
        }
    }

    static isAtomicNote(frontmatter: Record<string, any>): boolean {
        return frontmatter?.atomic-task === true;
    }
}
```

#### Task 5: Frontmatter Writer Implementation
**Priority**: High
**Dependencies**: Task 4
**Description**: Create utilities to safely write frontmatter back to markdown files

**Pseudocode**:
```typescript
// src/frontmatter/frontmatter.writer.ts
export class FrontmatterWriter {
    static async writeFrontmatter(file: TFile, frontmatter: Record<string, any>): Promise<void> {
        try {
            const content = await this.app.vault.read(file);
            const yamlString = yaml.dump(frontmatter, { indent: 2 });

            let newContent: string;
            if (content.startsWith('---\n')) {
                // Replace existing frontmatter
                newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${yamlString}---`);
            } else {
                // Add new frontmatter
                newContent = `---\n${yamlString}---\n\n${content}`;
            }

            await this.app.vault.modify(file, newContent);
        } catch (error) {
            console.error('Failed to write frontmatter:', error);
            throw error;
        }
    }
}
```

#### Task 6: Schema Validator Implementation
**Priority**: High
**Dependencies**: Task 5
**Description**: Create validation engine for atomic task schema enforcement

**Pseudocode**:
```typescript
// src/schema/schema.validator.ts
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}

export class SchemaValidator {
    static validate(frontmatter: Record<string, any>): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Check required fields
        for (const field of REQUIRED_FIELDS) {
            if (!frontmatter.hasOwnProperty(field)) {
                result.errors.push({
                    field,
                    message: `Required field '${field}' is missing`,
                    severity: 'error'
                });
                result.isValid = false;
            }
        }

        // Validate field types
        this.validateFieldTypes(frontmatter, result);

        // Validate date formats
        this.validateDateFields(frontmatter, result);

        // Validate enum values
        this.validateEnumFields(frontmatter, result);

        return result;
    }

    private static validateFieldTypes(frontmatter: Record<string, any>, result: ValidationResult): void {
        // Implementation for type validation
    }

    private static validateDateFields(frontmatter: Record<string, any>, result: ValidationResult): void {
        // Implementation for date validation
    }

    private static validateEnumFields(frontmatter: Record<string, any>, result: ValidationResult): void {
        // Implementation for enum validation
    }
}
```

#### Task 7: Default Value Assignment
**Priority**: High
**Dependencies**: Task 6
**Description**: Implement auto-population logic for missing required fields

**Pseudocode**:
```typescript
// src/schema/schema.defaults.ts
export class DefaultValueAssigner {
    static assignDefaults(frontmatter: Record<string, any>, filename: string): Record<string, any> {
        const updated = { ...frontmatter };

        // Auto-populate title from filename if missing
        if (!updated.title) {
            updated.title = this.extractTitleFromFilename(filename);
        }

        // Auto-populate created_date if missing
        if (!updated.created_date) {
            updated.created_date = this.formatCurrentDate();
        }

        // Set default status if missing
        if (!updated.status) {
            updated.status = DEFAULT_VALUES.status;
        }

        // Set default priority if missing and enabled in settings
        if (!updated.priority && this.shouldSetDefaultPriority()) {
            updated.priority = DEFAULT_VALUES.priority;
        }

        return updated;
    }

    private static extractTitleFromFilename(filename: string): string {
        return filename.replace(/\.md$/, '').replace(/-/g, ' ');
    }

    private static formatCurrentDate(): string {
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    }
}
```

### Phase 3: Event System and Monitoring

#### Task 8: File Event Handler Setup
**Priority**: High
**Dependencies**: Task 7
**Description**: Implement file monitoring system for real-time validation

**Pseudocode**:
```typescript
// src/events/file.events.ts
export class FileEventHandler {
    constructor(private plugin: TaskSystemPlugin) {}

    registerEventHandlers(): void {
        // File creation handler
        this.plugin.registerEvent(
            this.plugin.app.vault.on('create', this.onFileCreated.bind(this))
        );

        // File modification handler
        this.plugin.registerEvent(
            this.plugin.app.vault.on('modify', this.onFileModified.bind(this))
        );

        // Metadata change handler
        this.plugin.registerEvent(
            this.plugin.app.metadataCache.on('changed', this.onMetadataChanged.bind(this))
        );
    }

    private async onFileCreated(file: TFile): Promise<void> {
        if (!this.isMarkdownFile(file)) return;

        // Check if it becomes an atomic note
        const frontmatter = await FrontmatterReader.readFrontmatter(file);
        if (frontmatter && FrontmatterReader.isAtomicNote(frontmatter)) {
            await this.validateAndPopulate(file, frontmatter);
        }
    }

    private async onFileModified(file: TFile): Promise<void> {
        if (!this.isMarkdownFile(file)) return;

        const frontmatter = await FrontmatterReader.readFrontmatter(file);
        if (frontmatter && FrontmatterReader.isAtomicNote(frontmatter)) {
            await this.validateAndPopulate(file, frontmatter);
        }
    }

    private async validateAndPopulate(file: TFile, frontmatter: Record<string, any>): Promise<void> {
        // Validate schema
        const validationResult = SchemaValidator.validate(frontmatter);

        // Auto-populate missing fields if enabled
        if (this.plugin.settings.autoPopulateDefaults) {
            const updatedFrontmatter = DefaultValueAssigner.assignDefaults(frontmatter, file.name);

            if (JSON.stringify(frontmatter) !== JSON.stringify(updatedFrontmatter)) {
                await FrontmatterWriter.writeFrontmatter(file, updatedFrontmatter);
                return; // Will trigger another modification event with updated data
            }
        }

        // Show warnings if validation failed
        if (!validationResult.isValid && this.plugin.settings.enableValidation) {
            this.showValidationWarnings(file.name, validationResult);
        }
    }
}
```

#### Task 9: Validation Warning System
**Priority**: Medium
**Dependencies**: Task 8
**Description**: Implement user-friendly warning notifications for schema violations

**Pseudocode**:
```typescript
// src/ui/notification.manager.ts
export class NotificationManager {
    static showValidationWarnings(filename: string, result: ValidationResult): void {
        if (result.errors.length > 0) {
            const errorMessages = result.errors.map(e => `• ${e.message}`).join('\n');
            new Notice(
                `Schema validation failed for "${filename}":\n${errorMessages}`,
                10000 // 10 second duration
            );
        }

        if (result.warnings.length > 0) {
            const warningMessages = result.warnings.map(w => `• ${w.message}`).join('\n');
            new Notice(
                `Schema warnings for "${filename}":\n${warningMessages}`,
                5000 // 5 second duration
            );
        }
    }

    static showSuccessMessage(filename: string): void {
        new Notice(`Schema validation passed for "${filename}"`, 2000);
    }
}
```

### Phase 4: Settings and Configuration

#### Task 10: Settings Interface Implementation
**Priority**: Medium
**Dependencies**: Task 9
**Description**: Create user configuration interface for plugin settings

**Pseudocode**:
```typescript
// src/settings/settings.interface.ts
export interface TaskSystemSettings {
    enableValidation: boolean;
    autoPopulateDefaults: boolean;
    validationMode: 'warn' | 'strict';
    defaultStatus: TaskStatus;
    defaultPriority: Priority;
    dateFormat: string;
    showSuccessNotifications: boolean;
    validationDelay: number; // ms delay for debouncing
}

export const DEFAULT_SETTINGS: TaskSystemSettings = {
    enableValidation: true,
    autoPopulateDefaults: true,
    validationMode: 'warn',
    defaultStatus: 'todo',
    defaultPriority: 'medium',
    dateFormat: 'YYYY-MM-DD',
    showSuccessNotifications: false,
    validationDelay: 500
};
```

#### Task 11: Settings Tab Implementation
**Priority**: Medium
**Dependencies**: Task 10
**Description**: Create settings UI for user configuration

**Pseudocode**:
```typescript
// src/settings/settings.tab.ts
export class TaskSystemSettingTab extends PluginSettingTab {
    plugin: TaskSystemPlugin;

    constructor(app: App, plugin: TaskSystemPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Atomic Task Schema Enforcer Settings' });

        // Enable validation toggle
        new Setting(containerEl)
            .setName('Enable schema validation')
            .setDesc('Validate frontmatter schema for atomic task notes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableValidation)
                .onChange(async (value) => {
                    this.plugin.settings.enableValidation = value;
                    await this.plugin.saveSettings();
                }));

        // Auto-populate defaults toggle
        new Setting(containerEl)
            .setName('Auto-populate missing fields')
            .setDesc('Automatically fill in required fields with default values')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoPopulateDefaults)
                .onChange(async (value) => {
                    this.plugin.settings.autoPopulateDefaults = value;
                    await this.plugin.saveSettings();
                }));

        // Default status dropdown
        new Setting(containerEl)
            .setName('Default task status')
            .setDesc('Default status for new atomic tasks')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'todo': 'To Do',
                    'in_progress': 'In Progress',
                    'blocked': 'Blocked',
                    'done': 'Done'
                })
                .setValue(this.plugin.settings.defaultStatus)
                .onChange(async (value) => {
                    this.plugin.settings.defaultStatus = value as TaskStatus;
                    await this.plugin.saveSettings();
                }));

        // More settings...
    }
}
```

### Phase 5: Commands and Polish

#### Task 12: Plugin Commands Implementation
**Priority**: Low
**Dependencies**: Task 11
**Description**: Add user commands for manual validation and schema operations

**Pseudocode**:
```typescript
// src/commands/validation.commands.ts
export class ValidationCommands {
    static registerCommands(plugin: TaskSystemPlugin): void {
        // Manual validation command
        plugin.addCommand({
            id: 'validate-current-file',
            name: 'Validate current file schema',
            checkCallback: (checking: boolean) => {
                const activeFile = plugin.app.workspace.getActiveFile();
                if (activeFile && activeFile.extension === 'md') {
                    if (!checking) {
                        this.validateCurrentFile(plugin, activeFile);
                    }
                    return true;
                }
                return false;
            }
        });

        // Convert to atomic task command
        plugin.addCommand({
            id: 'convert-to-atomic-task',
            name: 'Convert current file to atomic task',
            checkCallback: (checking: boolean) => {
                const activeFile = plugin.app.workspace.getActiveFile();
                if (activeFile && activeFile.extension === 'md') {
                    if (!checking) {
                        this.convertToAtomicTask(plugin, activeFile);
                    }
                    return true;
                }
                return false;
            }
        });
    }

    private static async validateCurrentFile(plugin: TaskSystemPlugin, file: TFile): Promise<void> {
        // Implementation for manual validation
    }

    private static async convertToAtomicTask(plugin: TaskSystemPlugin, file: TFile): Promise<void> {
        // Implementation for converting file to atomic task
    }
}
```

#### Task 13: Error Handling and Logging
**Priority**: Low
**Dependencies**: Task 12
**Description**: Implement comprehensive error handling and debug logging

**Pseudocode**:
```typescript
// src/utils/logger.ts
export class Logger {
    private static isDebugMode(): boolean {
        return process.env.NODE_ENV === 'development';
    }

    static debug(message: string, data?: any): void {
        if (this.isDebugMode()) {
            console.log(`[TaskSystem] DEBUG: ${message}`, data);
        }
    }

    static error(message: string, error?: Error): void {
        console.error(`[TaskSystem] ERROR: ${message}`, error);
    }

    static warn(message: string, data?: any): void {
        console.warn(`[TaskSystem] WARN: ${message}`, data);
    }
}

// src/utils/error-handler.ts
export class ErrorHandler {
    static async handleAsyncError<T>(
        operation: () => Promise<T>,
        context: string
    ): Promise<T | null> {
        try {
            return await operation();
        } catch (error) {
            Logger.error(`Error in ${context}:`, error as Error);
            new Notice(`Error: ${context} failed. Check console for details.`);
            return null;
        }
    }
}
```

#### Task 14: Performance Optimization
**Priority**: Low
**Dependencies**: Task 13
**Description**: Implement debouncing and performance optimizations for file monitoring

**Pseudocode**:
```typescript
// src/utils/debounce.ts
export class DebounceManager {
    private static timers: Map<string, NodeJS.Timeout> = new Map();

    static debounce(key: string, callback: () => void, delay: number): void {
        const existingTimer = this.timers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
            callback();
            this.timers.delete(key);
        }, delay);

        this.timers.set(key, timer);
    }

    static cancel(key: string): void {
        const timer = this.timers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(key);
        }
    }
}
```

## Technical Considerations

### Obsidian API Integration
- **MetadataCache**: Use for efficient frontmatter access without file parsing
- **Vault Events**: Monitor file changes with proper event registration
- **TFile Operations**: Safe file reading/writing with error handling
- **Settings Persistence**: Leverage existing loadData/saveData patterns

### Performance Considerations
- **Debouncing**: Prevent excessive validation on rapid file changes
- **Lazy Loading**: Initialize components only when needed
- **Memory Management**: Proper cleanup of event listeners and timers
- **File Filtering**: Only process markdown files with atomic-task: true

### Error Handling Strategy
- **Graceful Degradation**: Continue operation even if validation fails
- **User Feedback**: Clear, actionable error messages
- **Debug Logging**: Comprehensive logging for troubleshooting
- **Rollback Capability**: Ability to undo auto-population if needed

### Security Considerations
- **YAML Safety**: Use safe YAML parsing to prevent code injection
- **File Validation**: Verify file extensions and content before processing
- **User Input Sanitization**: Clean user input in settings
- **Error Message Sanitization**: Prevent information leakage in error messages

## File Structure Plan

```
src/
├── main.ts                     # Plugin entry point (minimalist)
├── schema/
│   ├── schema.definition.ts    # AtomicTaskSchema interface and types
│   ├── schema.validator.ts     # Validation engine
│   └── schema.defaults.ts      # Default value assignment
├── frontmatter/
│   ├── frontmatter.reader.ts   # YAML parsing utilities
│   └── frontmatter.writer.ts   # YAML writing utilities
├── events/
│   ├── file.events.ts         # File change handlers
│   └── vault.monitor.ts       # Vault monitoring setup
├── settings/
│   ├── settings.interface.ts  # Settings type definitions
│   ├── settings.tab.ts        # Settings UI components
│   └── settings.defaults.ts   # Default settings values
├── commands/
│   └── validation.commands.ts # User commands implementation
├── ui/
│   └── notification.manager.ts # User feedback utilities
└── utils/
    ├── logger.ts              # Debug logging utilities
    ├── error-handler.ts       # Error handling utilities
    ├── debounce.ts           # Performance utilities
    └── date.utils.ts         # Date formatting/parsing
```

## Dependencies

### New Dependencies to Add
```json
{
  "dependencies": {
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.5"
  }
}
```

### Existing Dependencies (Keep)
- obsidian (TypeScript definitions)
- esbuild (bundling)
- typescript (compilation)
- @typescript-eslint/* (linting)

## Testing Strategy

### Unit Tests
- Schema validation with various input combinations
- Frontmatter parsing edge cases (malformed YAML, missing sections)
- Default value assignment logic
- Date formatting and parsing utilities

### Integration Tests
- File event handling scenarios
- Settings persistence and loading
- Full validation workflow (read → validate → auto-populate → write)

### Manual Testing Scenarios
1. Create new markdown file, add `atomic-task: true`
2. Modify existing atomic task file with invalid schema
3. Test all settings combinations
4. Test performance with many files
5. Test error scenarios (corrupted YAML, file permissions)

## Risk Assessment

### High Risk Areas
1. **YAML Parsing Errors**: Malformed frontmatter could crash validation
   - **Mitigation**: Comprehensive try-catch blocks and safe parsing
2. **File Write Conflicts**: Concurrent modifications during auto-population
   - **Mitigation**: File locking patterns and conflict detection
3. **Performance Impact**: Real-time validation on large vaults
   - **Mitigation**: Debouncing and efficient file filtering

### Medium Risk Areas
1. **Settings Migration**: Future schema changes breaking existing settings
   - **Mitigation**: Version-aware settings migration logic
2. **User Experience**: Too many notifications becoming annoying
   - **Mitigation**: Configurable notification levels and batching

### Low Risk Areas
1. **Compatibility**: Plugin conflicts with other frontmatter plugins
   - **Mitigation**: Standard Obsidian API usage and defensive programming

## TODO Tracker

### Planning Status
- [x] Research analysis complete
- [x] Architecture design complete
- [x] Task breakdown complete
- [x] Technical considerations documented
- [x] Risk assessment complete

### Implementation Readiness
- [ ] Dependencies identified and ready for installation
- [ ] File structure planned and validated
- [ ] Testing strategy defined
- [ ] Error handling patterns established

### Next Steps
1. Begin Phase 1: Foundation Setup (Tasks 1-3)
2. Set up development environment with hot-reload
3. Implement core schema system (Tasks 4-7)
4. Add event monitoring (Tasks 8-9)
5. Create settings interface (Tasks 10-11)
6. Polish and optimize (Tasks 12-14)

## Success Criteria

### Core Functionality
- [x] Plugin correctly identifies atomic task files (`atomic-task: true`)
- [x] Schema validation works for all defined field types
- [x] Auto-population of missing required fields functions correctly
- [x] Real-time monitoring responds to file changes within 500ms
- [x] User warnings are clear and actionable

### User Experience
- [x] Settings interface is intuitive and comprehensive
- [x] Plugin operates without blocking file saves
- [x] Error messages are helpful and non-technical
- [x] Performance impact is minimal (< 100ms validation time)

### Technical Quality
- [x] Code follows Obsidian plugin best practices
- [x] Error handling is comprehensive and graceful
- [x] Memory usage is efficient with proper cleanup
- [x] Plugin loads and unloads cleanly without side effects

---

**Implementation Note**: This plan provides a systematic approach to building the Atomic Task Schema Enforcer from the existing template foundation. Each task is designed to be implementable within 1-4 hours and builds incrementally toward the complete feature set defined in the PRD. The modular architecture ensures maintainability and allows for future extensibility while adhering to Obsidian plugin development best practices.