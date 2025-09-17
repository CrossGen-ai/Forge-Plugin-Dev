# Obsidian Plugin API Reference

Complete reference for Obsidian plugin development APIs, interfaces, and methods.

## Table of Contents
- [Core Classes](#core-classes)
- [Plugin Lifecycle](#plugin-lifecycle)
- [App Interface](#app-interface)
- [Workspace APIs](#workspace-apis)
- [File Management](#file-management)
- [UI Components](#ui-components)
- [Event System](#event-system)
- [Settings Management](#settings-management)

## Core Classes

### Plugin Class
Base class for all Obsidian plugins.

```typescript
export abstract class Plugin extends Component {
    app: App;
    manifest: PluginManifest;

    constructor(app: App, manifest: PluginManifest);

    // Lifecycle methods
    async onload(): Promise<void>;
    async onunload(): Promise<void>;
    onExternalSettingsChange?(): any;

    // Data management
    async loadData(): Promise<any>;
    async saveData(data: any): Promise<void>;

    // Registration helpers
    registerEvent(eventRef: EventRef): void;
    registerDomEvent(element: Element, type: string, callback: EventListener): void;
    registerInterval(intervalId: number): void;
}
```

### App Interface
Central application object providing access to all Obsidian functionality.

```typescript
interface App {
    workspace: Workspace;
    vault: Vault;
    metadataCache: MetadataCache;
    fileManager: FileManager;
    setting: SettingTab;
    commands: Commands;
    keymap: Keymap;

    // Event methods
    on(name: string, callback: (...args: any[]) => any): EventRef;
    off(name: string, callback: (...args: any[]) => any): void;
}
```


## Plugin Lifecycle

### onload() Method
Called when plugin is enabled. Use for initialization.

```typescript
async onload() {
    console.log('Loading plugin');

    // Register views
    this.registerView(VIEW_TYPE, (leaf) => new CustomView(leaf));

    // Add commands
    this.addCommand({
        id: 'my-command',
        name: 'My Command',
        callback: () => this.executeCommand()
    });

    // Add ribbon icons
    this.addRibbonIcon('dice', 'My Plugin', () => {
        new Notice('Hello from plugin!');
    });

    // Load settings
    await this.loadSettings();
}
```

### onunload() Method
Called when plugin is disabled. Use for cleanup.

```typescript
async onunload() {
    console.log('Unloading plugin');
    // Cleanup is handled automatically for registered events/intervals
}
```

## App Interface

### Workspace
Manages panes, tabs, and views in the workspace.

```typescript
interface Workspace {
    activeEditor: MarkdownView | null;

    // Leaf management
    getActiveViewOfType<T extends View>(type: Constructor<T>): T | null;
    getLeavesOfType(viewType: string): WorkspaceLeaf[];
    getLeaf(newLeaf?: boolean): WorkspaceLeaf;
    getRightLeaf(split: boolean): WorkspaceLeaf;
    getLeftLeaf(split: boolean): WorkspaceLeaf;

    // View operations
    revealLeaf(leaf: WorkspaceLeaf): void;
    setActiveLeaf(leaf: WorkspaceLeaf): void;
}
```

### Accessing Active Editor (v1.1.1+)
New preferred method for accessing the active editor:

```typescript
// New approach (recommended)
let { activeEditor } = app.workspace;
if (activeEditor) {
    let editor = activeEditor.editor;
    let file = activeEditor.file;
}

// Old approach (deprecated)
let view = app.workspace.getActiveViewOfType(MarkdownView);
if (view) {
    let editor = view.editor;
    let file = view.file;
}
```

## File Management

### Vault Interface
Provides file system operations.

```typescript
interface Vault {
    // File operations
    create(path: string, data: string): Promise<TFile>;
    read(file: TFile): Promise<string>;
    modify(file: TFile, data: string): Promise<void>;
    delete(file: TFile): Promise<void>;
    rename(file: TFile, newPath: string): Promise<void>;

    // Directory operations
    createFolder(path: string): Promise<TFolder>;

    // File discovery
    getAbstractFileByPath(path: string): TAbstractFile | null;
    getMarkdownFiles(): TFile[];
    getAllLoadedFiles(): TAbstractFile[];
}
```

### FileManager
Advanced file operations and frontmatter management.

```typescript
interface FileManager {
    // Frontmatter operations (v1.4.0+)
    processFrontMatter(file: TFile, fn: (frontmatter: any) => void): Promise<void>;

    // File creation
    createNewMarkdownFile(folder: TFolder, filename?: string): Promise<TFile>;
}
```

### Processing Frontmatter
```typescript
// Atomic frontmatter updates
app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter["key1"] = value;
    delete frontmatter["key2"];
});
```

## UI Components

### Modal
Base class for modal dialogs.

```typescript
export class CustomModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Modal Title" });

        const setting = new Setting(contentEl)
            .setName("Setting name")
            .setDesc("Setting description")
            .addText(text => text
                .setPlaceholder("Enter text")
                .onChange(async (value) => {
                    // Handle change
                })
            );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
```

### Notice
Display temporary notifications.

```typescript
// Simple notice
new Notice("Hello world!");

// Notice with duration
new Notice("This will disappear in 5 seconds", 5000);

// Notice with fragment
const fragment = document.createDocumentFragment();
fragment.createEl("strong", { text: "Bold text" });
new Notice(fragment);
```

### ItemView
Base class for custom views.

```typescript
export class CustomView extends ItemView {
    getViewType() {
        return VIEW_TYPE_CUSTOM;
    }

    getDisplayText() {
        return "Custom View";
    }

    async onOpen() {
        const container = this.contentEl;
        container.empty();
        container.createEl("h4", { text: "Custom View Content" });
    }

    async onClose() {
        // Cleanup if needed
    }
}
```

## Event System

### Registering Events
Always use plugin registration methods to ensure cleanup.

```typescript
// App events
this.registerEvent(app.on('event-name', callback));

// DOM events
this.registerDomEvent(element, 'click', callback);

// Intervals
this.registerInterval(setInterval(callback, 1000));
```

### Common Events
```typescript
// File events
this.registerEvent(app.vault.on('create', (file) => {
    console.log('File created:', file.path);
}));

this.registerEvent(app.vault.on('modify', (file) => {
    console.log('File modified:', file.path);
}));

this.registerEvent(app.vault.on('delete', (file) => {
    console.log('File deleted:', file.path);
}));

// Workspace events
this.registerEvent(app.workspace.on('file-open', (file) => {
    console.log('File opened:', file?.path);
}));
```

## Settings Management

### Settings Interface
Define your plugin settings structure.

```typescript
interface MyPluginSettings {
    dateFormat: string;
    enableFeature: boolean;
    apiKey: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    dateFormat: 'YYYY-MM-DD',
    enableFeature: true,
    apiKey: ''
}
```

### Settings Tab
Create a settings UI.

```typescript
export class MySettingTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Date format')
            .setDesc('Format for displaying dates')
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD')
                .setValue(this.plugin.settings.dateFormat)
                .onChange(async (value) => {
                    this.plugin.settings.dateFormat = value;
                    await this.plugin.saveSettings();
                })
            );

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
    }
}
```

### Plugin Settings Management
```typescript
export default class MyPlugin extends Plugin {
    settings: MyPluginSettings;

    async onload() {
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new MySettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    // Handle external settings changes
    async onExternalSettingsChange() {
        await this.loadSettings();
        // Update UI or restart features as needed
    }
}
```

## API Updates and Migration

### Fuzzy Search (v1.3.0+)
```typescript
// Old (deprecated)
let pq: PreparedQuery = prepareQuery(q);
fuzzySearch(pq, text);

// New
let fuzzy = prepareFuzzySearch(q);
fuzzy(text);
```

### SliderComponent (v1.5.9+)
```typescript
// To maintain old behavior of continuous updates
if (slider.setInstant) {
    slider.setInstant(true);
}
```

### Opening Tabs/Windows
```typescript
// Consistent with user modifier keys
getLeaf(Keymap.isModEvent(evt))
```

## Resource Links

- **Official API**: https://github.com/obsidianmd/obsidian-api
- **Developer Docs**: https://docs.obsidian.md/
- **TypeScript API**: https://docs.obsidian.md/Reference/TypeScript+API/
- **Sample Plugin**: https://github.com/obsidianmd/obsidian-sample-plugin
- **Community Documentation**: https://marcusolsson.github.io/obsidian-plugin-docs/
- **Extended Typings**: https://github.com/Fevol/obsidian-typings