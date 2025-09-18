import { Plugin } from 'obsidian';
import { TaskSystemSettings, DEFAULT_SETTINGS } from './settings/settings.interface';
import { TaskSystemSettingTab } from './settings/settings.tab';
import { FileEventHandler } from './events/file.events';
import { ValidationCommands } from './commands/validation.commands';
import { DebounceManager } from './utils/debounce';
import { Logger } from './utils/logger';

export default class TaskSystemPlugin extends Plugin {
    settings: TaskSystemSettings;
    fileEventHandler: FileEventHandler;

    async onload() {
        Logger.info('Loading Atomic Task Schema Enforcer plugin');

        // Load settings
        await this.loadSettings();

        // Initialize core systems
        this.fileEventHandler = new FileEventHandler(this);

        // Setup event handlers
        this.fileEventHandler.registerEventHandlers();

        // Register commands
        ValidationCommands.registerCommands(this);

        // Add settings tab
        this.addSettingTab(new TaskSystemSettingTab(this.app, this));

        // Add ribbon icon
        const ribbonIconEl = this.addRibbonIcon('list-checks', 'Atomic Task Schema Enforcer', () => {
            this.fileEventHandler.validateCurrentFile();
        });
        ribbonIconEl.addClass('task-system-ribbon');

        Logger.info('Atomic Task Schema Enforcer plugin loaded successfully');
    }

    async onunload() {
        Logger.info('Unloading Atomic Task Schema Enforcer plugin');

        // Cancel all debounced operations
        DebounceManager.cancelAll();

        Logger.info('Atomic Task Schema Enforcer plugin unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        Logger.debug('Settings loaded:', this.settings);
    }

    async saveSettings() {
        await this.saveData(this.settings);
        Logger.debug('Settings saved:', this.settings);
    }

    // Handle external settings changes (called by Obsidian when settings change externally)
    async onExternalSettingsChange() {
        await this.loadSettings();
        Logger.debug('External settings change detected, reloaded settings');
    }
}