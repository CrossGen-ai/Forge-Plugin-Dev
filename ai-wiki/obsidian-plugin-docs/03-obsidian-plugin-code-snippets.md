# Obsidian Plugin Code Snippets

Complete collection of code examples, patterns, and snippets for Obsidian plugin development.

## Table of Contents
- [Plugin Initialization](#plugin-initialization)
- [File Operations](#file-operations)
- [UI Components](#ui-components)
- [Event Handling](#event-handling)
- [Settings Management](#settings-management)
- [Commands](#commands)
- [Views and Modals](#views-and-modals)
- [Utility Functions](#utility-functions)
- [Advanced Patterns](#advanced-patterns)

## Plugin Initialization

### Basic Plugin Structure
```typescript
import { Plugin, PluginManifest, App } from 'obsidian';

export default class MyPlugin extends Plugin {
    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
    }

    async onload() {
        console.log('Loading plugin');
        await this.loadSettings();
        this.addCommands();
        this.registerEvents();
    }

    async onunload() {
        console.log('Unloading plugin');
        // Cleanup is automatic for registered events
    }
}
```

### Plugin with Settings
```typescript
interface MyPluginSettings {
    enableFeature: boolean;
    apiKey: string;
    refreshInterval: number;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    enableFeature: true,
    apiKey: '',
    refreshInterval: 5000
};

export default class MyPlugin extends Plugin {
    settings: MyPluginSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new MySettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
```

## File Operations

### Reading Files
```typescript
// Read current active file
const activeFile = this.app.workspace.getActiveFile();
if (activeFile) {
    const content = await this.app.vault.read(activeFile);
    console.log('File content:', content);
}

// Read specific file by path
const file = this.app.vault.getAbstractFileByPath('path/to/file.md');
if (file instanceof TFile) {
    const content = await this.app.vault.read(file);
}

// Read all markdown files
const markdownFiles = this.app.vault.getMarkdownFiles();
for (const file of markdownFiles) {
    const content = await this.app.vault.read(file);
    // Process content...
}
```

### Writing and Modifying Files
```typescript
// Create new file
const newFile = await this.app.vault.create('new-file.md', 'Initial content');

// Modify existing file
const file = this.app.workspace.getActiveFile();
if (file) {
    await this.app.vault.modify(file, 'New content');
}

// Append to file
const file = this.app.workspace.getActiveFile();
if (file) {
    const currentContent = await this.app.vault.read(file);
    await this.app.vault.modify(file, currentContent + '\nAppended text');
}

// Rename file
await this.app.vault.rename(file, 'new-name.md');

// Delete file
await this.app.vault.delete(file);
```

### Frontmatter Operations
```typescript
// Process frontmatter (Obsidian v1.4.0+)
const file = this.app.workspace.getActiveFile();
if (file) {
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter['last-modified'] = new Date().toISOString();
        frontmatter['processed'] = true;
        delete frontmatter['old-property'];
    });
}

// Read frontmatter via metadata cache
const file = this.app.workspace.getActiveFile();
if (file) {
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter;
    if (frontmatter) {
        console.log('Tags:', frontmatter.tags);
        console.log('Title:', frontmatter.title);
    }
}
```

### Working with Folders
```typescript
// Create folder
await this.app.vault.createFolder('new-folder');

// Get folder contents
const folder = this.app.vault.getAbstractFileByPath('folder-path');
if (folder instanceof TFolder) {
    folder.children.forEach(child => {
        if (child instanceof TFile) {
            console.log('File:', child.name);
        } else if (child instanceof TFolder) {
            console.log('Folder:', child.name);
        }
    });
}

// Recursive folder traversal
function traverseFolder(folder: TFolder, callback: (file: TFile) => void) {
    folder.children.forEach(child => {
        if (child instanceof TFile) {
            callback(child);
        } else if (child instanceof TFolder) {
            traverseFolder(child, callback);
        }
    });
}
```

## UI Components

### Notice (Notifications)
```typescript
// Simple notice
new Notice('Operation completed!');

// Notice with duration
new Notice('This will disappear in 10 seconds', 10000);

// Notice with HTML content
const fragment = document.createDocumentFragment();
const strong = fragment.createEl('strong', { text: 'Important: ' });
fragment.appendText('Operation completed successfully');
new Notice(fragment);

// Error notice
new Notice('❌ Error: Operation failed', 5000);

// Success notice
new Notice('✅ Success: File processed', 3000);
```

### Creating DOM Elements
```typescript
// Create elements with attributes
const container = this.contentEl;
const header = container.createEl('h2', {
    text: 'Plugin Settings',
    cls: 'setting-header'
});

const button = container.createEl('button', {
    text: 'Click me',
    attr: {
        'data-action': 'process',
        'aria-label': 'Process files'
    }
});

// Add event listeners
button.addEventListener('click', () => {
    new Notice('Button clicked!');
});

// Create input elements
const input = container.createEl('input', {
    type: 'text',
    placeholder: 'Enter text...',
    value: this.settings.someValue
});

input.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    this.settings.someValue = target.value;
    this.saveSettings();
});
```

### Setting Components
```typescript
import { Setting } from 'obsidian';

// Text input setting
new Setting(containerEl)
    .setName('API Key')
    .setDesc('Enter your API key')
    .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
        })
    );

// Toggle setting
new Setting(containerEl)
    .setName('Enable feature')
    .setDesc('Toggle this feature on/off')
    .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableFeature)
        .onChange(async (value) => {
            this.plugin.settings.enableFeature = value;
            await this.plugin.saveSettings();
        })
    );

// Dropdown setting
new Setting(containerEl)
    .setName('Theme')
    .setDesc('Select theme')
    .addDropdown(dropdown => dropdown
        .addOption('light', 'Light')
        .addOption('dark', 'Dark')
        .addOption('auto', 'Auto')
        .setValue(this.plugin.settings.theme)
        .onChange(async (value) => {
            this.plugin.settings.theme = value;
            await this.plugin.saveSettings();
        })
    );

// Slider setting
new Setting(containerEl)
    .setName('Refresh interval')
    .setDesc('How often to refresh (seconds)')
    .addSlider(slider => slider
        .setLimits(1, 60, 1)
        .setValue(this.plugin.settings.refreshInterval)
        .setDynamicTooltip()
        .onChange(async (value) => {
            this.plugin.settings.refreshInterval = value;
            await this.plugin.saveSettings();
        })
    );

// Button setting
new Setting(containerEl)
    .setName('Clear cache')
    .setDesc('Remove all cached data')
    .addButton(button => button
        .setButtonText('Clear')
        .setCta()
        .onClick(async () => {
            await this.clearCache();
            new Notice('Cache cleared');
        })
    );
```

## Event Handling

### File Events
```typescript
// File creation
this.registerEvent(
    this.app.vault.on('create', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
            console.log('New markdown file created:', file.path);
            this.processNewFile(file);
        }
    })
);

// File modification
this.registerEvent(
    this.app.vault.on('modify', (file) => {
        if (file instanceof TFile) {
            console.log('File modified:', file.path);
            this.onFileModified(file);
        }
    })
);

// File deletion
this.registerEvent(
    this.app.vault.on('delete', (file) => {
        console.log('File deleted:', file.path);
        this.onFileDeleted(file);
    })
);

// File rename
this.registerEvent(
    this.app.vault.on('rename', (file, oldPath) => {
        console.log('File renamed from', oldPath, 'to', file.path);
    })
);
```

### Workspace Events
```typescript
// Active file change
this.registerEvent(
    this.app.workspace.on('file-open', (file) => {
        if (file) {
            console.log('Opened file:', file.path);
            this.onFileOpened(file);
        }
    })
);

// Layout change
this.registerEvent(
    this.app.workspace.on('layout-change', () => {
        console.log('Workspace layout changed');
        this.updateUI();
    })
);

// Active leaf change
this.registerEvent(
    this.app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf?.view instanceof MarkdownView) {
            console.log('Active markdown view changed');
            this.updateForActiveView(leaf.view);
        }
    })
);
```

### Editor Events
```typescript
// Get active editor
const { activeEditor } = this.app.workspace;
if (activeEditor) {
    const editor = activeEditor.editor;
    const file = activeEditor.file;

    // Cursor position change
    editor.on('cursorActivity', () => {
        const cursor = editor.getCursor();
        console.log('Cursor at line:', cursor.line, 'ch:', cursor.ch);
    });

    // Content change
    editor.on('change', (editor, changeObj) => {
        console.log('Editor content changed');
    });
}
```

### DOM Events
```typescript
// Window events
this.registerDomEvent(window, 'resize', () => {
    console.log('Window resized');
    this.handleResize();
});

// Document events
this.registerDomEvent(document, 'click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('my-plugin-element')) {
        this.handleElementClick(target);
    }
});

// Custom element events
const element = this.containerEl.querySelector('.my-element');
if (element) {
    this.registerDomEvent(element, 'custom-event', (e) => {
        console.log('Custom event triggered');
    });
}
```

### Debounced Events
```typescript
class DebouncedHandler {
    private debounceTimer: number | null = null;
    private readonly delay: number;

    constructor(delay: number = 300) {
        this.delay = delay;
    }

    execute(callback: () => void): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = window.setTimeout(() => {
            callback();
            this.debounceTimer = null;
        }, this.delay);
    }

    cancel(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }
}

// Usage
const debouncedHandler = new DebouncedHandler(500);

this.registerEvent(
    this.app.vault.on('modify', (file) => {
        debouncedHandler.execute(() => {
            this.processFile(file);
        });
    })
);
```

## Settings Management

### Complete Settings Implementation
```typescript
interface MyPluginSettings {
    apiKey: string;
    enableAutoSync: boolean;
    syncInterval: number;
    theme: 'light' | 'dark' | 'auto';
    customEndpoint: string;
    debugMode: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    apiKey: '',
    enableAutoSync: false,
    syncInterval: 300,
    theme: 'auto',
    customEndpoint: '',
    debugMode: false
};

export class MySettingTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Plugin Settings' });

        // API Configuration Section
        containerEl.createEl('h3', { text: 'API Configuration' });

        new Setting(containerEl)
            .setName('API Key')
            .setDesc('Your API key for external services')
            .addText(text => text
                .setPlaceholder('Enter API key...')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Custom Endpoint')
            .setDesc('Custom API endpoint (optional)')
            .addText(text => text
                .setPlaceholder('https://api.example.com')
                .setValue(this.plugin.settings.customEndpoint)
                .onChange(async (value) => {
                    this.plugin.settings.customEndpoint = value;
                    await this.plugin.saveSettings();
                })
            );

        // Sync Settings Section
        containerEl.createEl('h3', { text: 'Sync Settings' });

        new Setting(containerEl)
            .setName('Enable Auto Sync')
            .setDesc('Automatically sync data at specified intervals')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableAutoSync)
                .onChange(async (value) => {
                    this.plugin.settings.enableAutoSync = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide interval setting
                })
            );

        if (this.plugin.settings.enableAutoSync) {
            new Setting(containerEl)
                .setName('Sync Interval')
                .setDesc('How often to sync (seconds)')
                .addSlider(slider => slider
                    .setLimits(60, 3600, 60)
                    .setValue(this.plugin.settings.syncInterval)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.syncInterval = value;
                        await this.plugin.saveSettings();
                    })
                );
        }

        // Appearance Section
        containerEl.createEl('h3', { text: 'Appearance' });

        new Setting(containerEl)
            .setName('Theme')
            .setDesc('Select the plugin theme')
            .addDropdown(dropdown => dropdown
                .addOption('light', 'Light')
                .addOption('dark', 'Dark')
                .addOption('auto', 'Auto (follow Obsidian)')
                .setValue(this.plugin.settings.theme)
                .onChange(async (value: 'light' | 'dark' | 'auto') => {
                    this.plugin.settings.theme = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateTheme();
                })
            );

        // Advanced Section
        containerEl.createEl('h3', { text: 'Advanced' });

        new Setting(containerEl)
            .setName('Debug Mode')
            .setDesc('Enable debug logging')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.debugMode)
                .onChange(async (value) => {
                    this.plugin.settings.debugMode = value;
                    await this.plugin.saveSettings();
                })
            );

        // Actions Section
        containerEl.createEl('h3', { text: 'Actions' });

        new Setting(containerEl)
            .setName('Reset Settings')
            .setDesc('Reset all settings to defaults')
            .addButton(button => button
                .setButtonText('Reset')
                .setWarning()
                .onClick(async () => {
                    const confirmed = await this.confirmReset();
                    if (confirmed) {
                        this.plugin.settings = { ...DEFAULT_SETTINGS };
                        await this.plugin.saveSettings();
                        this.display();
                        new Notice('Settings reset to defaults');
                    }
                })
            );
    }

    private async confirmReset(): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new ConfirmModal(
                this.app,
                'Reset Settings',
                'Are you sure you want to reset all settings to defaults? This cannot be undone.',
                resolve
            );
            modal.open();
        });
    }
}

class ConfirmModal extends Modal {
    private resolve: (value: boolean) => void;

    constructor(
        app: App,
        private title: string,
        private message: string,
        resolve: (value: boolean) => void
    ) {
        super(app);
        this.resolve = resolve;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: this.title });
        contentEl.createEl('p', { text: this.message });

        const buttonContainer = contentEl.createDiv('modal-button-container');

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.addEventListener('click', () => {
            this.resolve(false);
            this.close();
        });

        const confirmButton = buttonContainer.createEl('button', {
            text: 'Confirm',
            cls: 'mod-warning'
        });
        confirmButton.addEventListener('click', () => {
            this.resolve(true);
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
```

## Commands

### Basic Commands
```typescript
// Simple command
this.addCommand({
    id: 'my-simple-command',
    name: 'My Simple Command',
    callback: () => {
        new Notice('Command executed!');
    }
});

// Command with hotkey
this.addCommand({
    id: 'my-hotkey-command',
    name: 'My Hotkey Command',
    hotkeys: [{ modifiers: ['Mod'], key: 'k' }],
    callback: () => {
        this.executeCommand();
    }
});

// Conditional command
this.addCommand({
    id: 'process-current-file',
    name: 'Process Current File',
    checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();

        // Return false if no file is open
        if (!file) return false;

        // Return false if file is not markdown
        if (file.extension !== 'md') return false;

        // If we're just checking, return true
        if (checking) return true;

        // Execute the command
        this.processFile(file);
        return true;
    }
});
```

### Editor Commands
```typescript
// Editor command that works on selection
this.addCommand({
    id: 'format-selection',
    name: 'Format Selection',
    editorCallback: (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        if (selection) {
            const formatted = this.formatText(selection);
            editor.replaceSelection(formatted);
        } else {
            new Notice('No text selected');
        }
    }
});

// Editor command with cursor position
this.addCommand({
    id: 'insert-timestamp',
    name: 'Insert Timestamp',
    editorCallback: (editor: Editor, view: MarkdownView) => {
        const cursor = editor.getCursor();
        const timestamp = new Date().toISOString();
        editor.replaceRange(timestamp, cursor);
    }
});

// Command that checks editor state
this.addCommand({
    id: 'toggle-bold',
    name: 'Toggle Bold',
    editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();

        if (!selection) return false;

        if (checking) return true;

        const isBold = selection.startsWith('**') && selection.endsWith('**');
        if (isBold) {
            editor.replaceSelection(selection.slice(2, -2));
        } else {
            editor.replaceSelection(`**${selection}**`);
        }
        return true;
    }
});
```

### Context Menu Commands
```typescript
// Add to file context menu
this.registerEvent(
    this.app.workspace.on('file-menu', (menu, file) => {
        menu.addItem((item) => {
            item.setTitle('Process with Plugin')
                .setIcon('gear')
                .onClick(async () => {
                    await this.processFile(file);
                    new Notice(`Processed ${file.name}`);
                });
        });
    })
);

// Add to editor context menu
this.registerEvent(
    this.app.workspace.on('editor-menu', (menu, editor, view) => {
        menu.addItem((item) => {
            item.setTitle('Custom Action')
                .setIcon('edit')
                .onClick(() => {
                    const selection = editor.getSelection();
                    if (selection) {
                        this.performAction(selection);
                    }
                });
        });
    })
);
```

## Views and Modals

### Custom Modal
```typescript
export class CustomModal extends Modal {
    private result: string = '';
    private onSubmit: (result: string) => void;

    constructor(app: App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'Enter Information' });

        const inputContainer = contentEl.createDiv();
        const input = inputContainer.createEl('input', {
            type: 'text',
            placeholder: 'Enter text...'
        });

        input.addEventListener('input', (e) => {
            this.result = (e.target as HTMLInputElement).value;
        });

        const buttonContainer = contentEl.createDiv('modal-button-container');

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.addEventListener('click', () => this.close());

        const submitButton = buttonContainer.createEl('button', {
            text: 'Submit',
            cls: 'mod-cta'
        });
        submitButton.addEventListener('click', () => {
            this.onSubmit(this.result);
            this.close();
        });

        // Focus the input
        input.focus();

        // Handle Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.onSubmit(this.result);
                this.close();
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// Usage
const modal = new CustomModal(this.app, (result) => {
    if (result) {
        new Notice(`You entered: ${result}`);
    }
});
modal.open();
```

### Custom View
```typescript
export const CUSTOM_VIEW_TYPE = 'custom-view';

export class CustomView extends ItemView {
    private data: any[] = [];

    getViewType() {
        return CUSTOM_VIEW_TYPE;
    }

    getDisplayText() {
        return 'Custom View';
    }

    getIcon() {
        return 'document';
    }

    async onOpen() {
        const container = this.contentEl;
        container.empty();
        container.addClass('custom-view');

        await this.render();
    }

    async onClose() {
        // Cleanup if needed
    }

    private async render() {
        const container = this.contentEl;

        // Header
        const header = container.createDiv('view-header');
        header.createEl('h2', { text: 'Custom View' });

        const refreshButton = header.createEl('button', {
            text: 'Refresh',
            cls: 'clickable-icon'
        });
        refreshButton.addEventListener('click', () => this.refresh());

        // Content
        const content = container.createDiv('view-content');
        await this.renderContent(content);
    }

    private async renderContent(container: HTMLElement) {
        container.empty();

        if (this.data.length === 0) {
            container.createEl('p', { text: 'No data available' });
            return;
        }

        const list = container.createEl('ul');
        this.data.forEach(item => {
            const listItem = list.createEl('li');
            listItem.createEl('span', { text: item.name });

            const button = listItem.createEl('button', { text: 'Action' });
            button.addEventListener('click', () => this.handleItemAction(item));
        });
    }

    private async refresh() {
        // Refresh data
        this.data = await this.loadData();
        await this.render();
    }

    private async loadData(): Promise<any[]> {
        // Load your data here
        return [];
    }

    private handleItemAction(item: any) {
        new Notice(`Action performed on ${item.name}`);
    }
}

// Register view in plugin
this.registerView(CUSTOM_VIEW_TYPE, (leaf) => new CustomView(leaf));

// Add ribbon icon to open view
this.addRibbonIcon('document', 'Open Custom View', () => {
    this.activateView();
});

// Method to activate view
async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(CUSTOM_VIEW_TYPE);

    if (leaves.length > 0) {
        leaf = leaves[0];
    } else {
        leaf = workspace.getRightLeaf(false);
        await leaf.setViewState({ type: CUSTOM_VIEW_TYPE, active: true });
    }

    workspace.revealLeaf(leaf);
}
```

## Utility Functions

### File Utilities
```typescript
export class FileUtils {
    static async ensureFileExists(vault: Vault, path: string, content: string = ''): Promise<TFile> {
        let file = vault.getAbstractFileByPath(path);

        if (!file) {
            // Create parent folders if they don't exist
            const pathParts = path.split('/');
            let currentPath = '';

            for (let i = 0; i < pathParts.length - 1; i++) {
                currentPath += (currentPath ? '/' : '') + pathParts[i];

                if (!vault.getAbstractFileByPath(currentPath)) {
                    await vault.createFolder(currentPath);
                }
            }

            file = await vault.create(path, content);
        }

        return file as TFile;
    }

    static async copyFile(vault: Vault, sourceFile: TFile, targetPath: string): Promise<TFile> {
        const content = await vault.read(sourceFile);
        return await vault.create(targetPath, content);
    }

    static async moveFile(vault: Vault, file: TFile, newPath: string): Promise<void> {
        await vault.rename(file, newPath);
    }

    static getFileExtension(filename: string): string {
        return filename.split('.').pop()?.toLowerCase() || '';
    }

    static sanitizeFileName(name: string): string {
        return name.replace(/[<>:"/\\|?*]/g, '-').substring(0, 100);
    }

    static async getFileSize(vault: Vault, file: TFile): Promise<number> {
        const stat = await vault.adapter.stat(file.path);
        return stat?.size || 0;
    }
}
```

### Text Processing Utilities
```typescript
export class TextUtils {
    static extractHeadings(content: string): Array<{ level: number, text: string, line: number }> {
        const headings: Array<{ level: number, text: string, line: number }> = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                headings.push({
                    level: match[1].length,
                    text: match[2].trim(),
                    line: index
                });
            }
        });

        return headings;
    }

    static extractLinks(content: string): Array<{ text: string, url: string, type: 'wiki' | 'markdown' }> {
        const links: Array<{ text: string, url: string, type: 'wiki' | 'markdown' }> = [];

        // Wiki links [[text|display]]
        const wikiLinkRegex = /\[\[([^\]]+?)(?:\|([^\]]+?))?\]\]/g;
        let match;

        while ((match = wikiLinkRegex.exec(content)) !== null) {
            links.push({
                text: match[2] || match[1],
                url: match[1],
                type: 'wiki'
            });
        }

        // Markdown links [text](url)
        const markdownLinkRegex = /\[([^\]]+?)\]\(([^)]+?)\)/g;

        while ((match = markdownLinkRegex.exec(content)) !== null) {
            links.push({
                text: match[1],
                url: match[2],
                type: 'markdown'
            });
        }

        return links;
    }

    static extractTags(content: string): string[] {
        const tagRegex = /#([a-zA-Z0-9_/-]+)/g;
        const tags: string[] = [];
        let match;

        while ((match = tagRegex.exec(content)) !== null) {
            tags.push(match[1]);
        }

        return [...new Set(tags)]; // Remove duplicates
    }

    static wordCount(content: string): number {
        return content.trim().split(/\s+/).length;
    }

    static readingTime(content: string, wordsPerMinute: number = 200): number {
        const words = this.wordCount(content);
        return Math.ceil(words / wordsPerMinute);
    }

    static truncate(text: string, maxLength: number, suffix: string = '...'): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    }
}
```

### Date and Time Utilities
```typescript
export class DateUtils {
    static formatDate(date: Date, format: string): string {
        const map: Record<string, string> = {
            'YYYY': date.getFullYear().toString(),
            'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
            'DD': date.getDate().toString().padStart(2, '0'),
            'HH': date.getHours().toString().padStart(2, '0'),
            'mm': date.getMinutes().toString().padStart(2, '0'),
            'ss': date.getSeconds().toString().padStart(2, '0')
        };

        return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => map[match]);
    }

    static parseNaturalDate(input: string): Date | null {
        const today = new Date();
        const normalizedInput = input.toLowerCase().trim();

        switch (normalizedInput) {
            case 'today':
                return today;
            case 'tomorrow':
                return new Date(today.getTime() + 24 * 60 * 60 * 1000);
            case 'yesterday':
                return new Date(today.getTime() - 24 * 60 * 60 * 1000);
            default:
                // Try to parse as regular date
                const parsed = new Date(input);
                return isNaN(parsed.getTime()) ? null : parsed;
        }
    }

    static getWeekNumber(date: Date): number {
        const firstDay = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + firstDay.getDay() + 1) / 7);
    }

    static isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    static daysSince(date: Date): number {
        const today = new Date();
        const diffTime = today.getTime() - date.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
}
```

## Advanced Patterns

### Cache Management
```typescript
export class CacheManager<T> {
    private cache = new Map<string, { data: T, timestamp: number, ttl: number }>();
    private cleanupInterval: number;

    constructor(private defaultTTL: number = 300000) { // 5 minutes
        this.cleanupInterval = window.setInterval(() => this.cleanup(), 60000);
    }

    set(key: string, data: T, ttl?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL
        });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    async getOrCompute(key: string, computer: () => Promise<T>, ttl?: number): Promise<T> {
        const cached = this.get(key);
        if (cached !== null) return cached;

        const computed = await computer();
        this.set(key, computed, ttl);
        return computed;
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }

    destroy(): void {
        this.clear();
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

// Usage
const cache = new CacheManager<string>(600000); // 10 minutes TTL

async function getProcessedContent(file: TFile): Promise<string> {
    return await cache.getOrCompute(
        `processed:${file.path}:${file.stat.mtime}`,
        async () => {
            const content = await app.vault.read(file);
            return await heavyProcessing(content);
        }
    );
}
```

### Plugin State Management
```typescript
interface PluginState {
    activeFiles: Set<string>;
    processingQueue: string[];
    lastSync: number;
    errors: Array<{ message: string, timestamp: number }>;
}

export class StateManager {
    private state: PluginState;
    private listeners = new Set<(state: PluginState) => void>();

    constructor() {
        this.state = {
            activeFiles: new Set(),
            processingQueue: [],
            lastSync: 0,
            errors: []
        };
    }

    getState(): Readonly<PluginState> {
        return this.state;
    }

    setState(updates: Partial<PluginState>): void {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
    }

    updateState(updater: (state: PluginState) => Partial<PluginState>): void {
        const updates = updater(this.state);
        this.setState(updates);
    }

    subscribe(listener: (state: PluginState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.state));
    }

    // Convenience methods
    addActiveFile(path: string): void {
        const activeFiles = new Set(this.state.activeFiles);
        activeFiles.add(path);
        this.setState({ activeFiles });
    }

    removeActiveFile(path: string): void {
        const activeFiles = new Set(this.state.activeFiles);
        activeFiles.delete(path);
        this.setState({ activeFiles });
    }

    addToQueue(path: string): void {
        if (!this.state.processingQueue.includes(path)) {
            this.setState({
                processingQueue: [...this.state.processingQueue, path]
            });
        }
    }

    removeFromQueue(path: string): void {
        this.setState({
            processingQueue: this.state.processingQueue.filter(p => p !== path)
        });
    }

    addError(message: string): void {
        const errors = [...this.state.errors, { message, timestamp: Date.now() }];
        // Keep only last 10 errors
        this.setState({ errors: errors.slice(-10) });
    }

    clearErrors(): void {
        this.setState({ errors: [] });
    }
}
```

### API Client Pattern
```typescript
export class ApiClient {
    private baseUrl: string;
    private apiKey: string;
    private timeout: number;

    constructor(baseUrl: string, apiKey: string, timeout: number = 10000) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.timeout = timeout;
    }

    async request<T>(
        endpoint: string,
        options: {
            method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
            data?: any;
            headers?: Record<string, string>;
        } = {}
    ): Promise<T> {
        const { method = 'GET', data, headers = {} } = options;

        const url = `${this.baseUrl}${endpoint}`;
        const requestOptions: any = {
            url,
            method,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                ...headers
            },
            timeout: this.timeout
        };

        if (data && ['POST', 'PUT'].includes(method)) {
            requestOptions.body = JSON.stringify(data);
        }

        try {
            const response = await requestUrl(requestOptions);
            return response.json;
        } catch (error) {
            throw new ApiError(`API request failed: ${error.message}`, error);
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, { method: 'POST', data });
    }

    async put<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, { method: 'PUT', data });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

class ApiError extends Error {
    constructor(message: string, public originalError?: any) {
        super(message);
        this.name = 'ApiError';
    }
}

// Usage
const client = new ApiClient('https://api.example.com', settings.apiKey);

try {
    const data = await client.post('/process', { content: fileContent });
    new Notice('Processing completed');
} catch (error) {
    if (error instanceof ApiError) {
        new Notice(`API Error: ${error.message}`);
    } else {
        new Notice('Unexpected error occurred');
    }
}
```

This comprehensive collection of code snippets covers the most common patterns and use cases in Obsidian plugin development, providing ready-to-use examples that can be adapted for specific needs.