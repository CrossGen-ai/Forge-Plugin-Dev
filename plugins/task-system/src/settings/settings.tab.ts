import { App, PluginSettingTab, Setting } from 'obsidian';
import { VALID_STATUS_VALUES, VALID_PRIORITY_VALUES } from '../schema/schema.definition';
import type TaskSystemPlugin from '../main';

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

        // Main validation toggle
        new Setting(containerEl)
            .setName('Enable schema validation')
            .setDesc('Validate frontmatter schema for atomic task notes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableValidation)
                .onChange(async (value) => {
                    this.plugin.settings.enableValidation = value;
                    await this.plugin.saveSettings();
                })
            );

        // Auto-populate defaults toggle
        new Setting(containerEl)
            .setName('Auto-populate missing fields')
            .setDesc('Automatically fill in required fields with default values when missing')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoPopulateDefaults)
                .onChange(async (value) => {
                    this.plugin.settings.autoPopulateDefaults = value;
                    await this.plugin.saveSettings();
                })
            );

        // Validation mode
        new Setting(containerEl)
            .setName('Validation mode')
            .setDesc('How strict validation should be')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'warn': 'Show warnings only',
                    'strict': 'Strict validation (future use)'
                })
                .setValue(this.plugin.settings.validationMode)
                .onChange(async (value) => {
                    this.plugin.settings.validationMode = value as 'warn' | 'strict';
                    await this.plugin.saveSettings();
                })
            );

        containerEl.createEl('h3', { text: 'Default Values' });

        // Default status dropdown
        new Setting(containerEl)
            .setName('Default task status')
            .setDesc('Default status for new atomic tasks')
            .addDropdown(dropdown => {
                const options: Record<string, string> = {};
                VALID_STATUS_VALUES.forEach(status => {
                    options[status] = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                });

                return dropdown
                    .addOptions(options)
                    .setValue(this.plugin.settings.defaultStatus)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultStatus = value as any;
                        await this.plugin.saveSettings();
                    });
            });

        // Default priority dropdown
        new Setting(containerEl)
            .setName('Default task priority')
            .setDesc('Default priority for new atomic tasks')
            .addDropdown(dropdown => {
                const options: Record<string, string> = {};
                VALID_PRIORITY_VALUES.forEach(priority => {
                    options[priority] = priority.charAt(0).toUpperCase() + priority.slice(1);
                });

                return dropdown
                    .addOptions(options)
                    .setValue(this.plugin.settings.defaultPriority)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultPriority = value as any;
                        await this.plugin.saveSettings();
                    });
            });

        // Date format
        new Setting(containerEl)
            .setName('Date format')
            .setDesc('Format for date fields (currently only YYYY-MM-DD supported)')
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD')
                .setValue(this.plugin.settings.dateFormat)
                .setDisabled(true) // Disabled for now as only one format is supported
            );

        containerEl.createEl('h3', { text: 'Notifications' });

        // Show success notifications
        new Setting(containerEl)
            .setName('Show success notifications')
            .setDesc('Show notifications when validation passes without issues')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showSuccessNotifications)
                .onChange(async (value) => {
                    this.plugin.settings.showSuccessNotifications = value;
                    await this.plugin.saveSettings();
                })
            );

        containerEl.createEl('h3', { text: 'Performance' });

        // Validation delay
        new Setting(containerEl)
            .setName('Validation delay (ms)')
            .setDesc('Delay before validating files after changes (prevents excessive validation)')
            .addSlider(slider => slider
                .setLimits(100, 2000, 100)
                .setValue(this.plugin.settings.validationDelay)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.validationDelay = value;
                    await this.plugin.saveSettings();
                })
            );

        // Add some helpful information
        containerEl.createEl('h3', { text: 'Schema Information' });

        const schemaInfo = containerEl.createDiv('schema-info');
        schemaInfo.createEl('p', { text: 'Required fields for atomic tasks:' });
        const requiredList = schemaInfo.createEl('ul');
        ['atomic_note (boolean)', 'title (string)', 'created_date (date)', 'status (enum)'].forEach(field => {
            requiredList.createEl('li', { text: field });
        });

        schemaInfo.createEl('p', { text: 'Optional fields:' });
        const optionalList = schemaInfo.createEl('ul');
        ['priority (enum)', 'due_date (date)', 'tags (array)', 'dependencies (array)', 'completed_date (date)'].forEach(field => {
            optionalList.createEl('li', { text: field });
        });
    }
}