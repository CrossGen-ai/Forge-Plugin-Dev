import { App, PluginSettingTab, Setting, Modal, TextComponent, DropdownComponent } from 'obsidian';
import { VALID_PRIORITY_VALUES, getCoreSchemaFields, getValidStatusValues } from '../schema/schema.definition';
import type { CustomSchemaField, StatusConfig } from './settings.interface';
import { ListEditorComponent } from './components/ListEditorComponent';
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

        // Status Configuration Section
        containerEl.createEl('h3', { text: 'Task Status Configuration' });
        const statusContainer = containerEl.createDiv('status-configuration-container');
        this.renderStatusConfiguration(statusContainer);

        containerEl.createEl('h3', { text: 'Default Values' });

        // Default status dropdown
        new Setting(containerEl)
            .setName('Default task status')
            .setDesc('Default status for new atomic tasks')
            .addDropdown(dropdown => {
                const options: Record<string, string> = {};
                const statusValues = getValidStatusValues(this.plugin.settings.statusConfigs);
                statusValues.forEach(status => {
                    const config = this.plugin.settings.statusConfigs.find(c => c.value === status);
                    options[status] = config?.label || status;
                });

                return dropdown
                    .addOptions(options)
                    .setValue(this.plugin.settings.defaultStatus)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultStatus = value;
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

        // Schema Configuration Section
        containerEl.createEl('h3', { text: 'Schema Configuration' });

        // Core fields information
        const coreInfo = containerEl.createDiv('core-fields-info');
        coreInfo.createEl('p', { text: 'Core required fields (cannot be modified):' });
        const coreList = coreInfo.createEl('ul');
        const coreFields = getCoreSchemaFields(this.plugin.settings.statusConfigs);
        coreFields.forEach(field => {
            const label = `${field.displayName || field.name} (${field.type}${field.required ? ', required' : ''})`;
            coreList.createEl('li', { text: label });
        });

        // Custom schema fields section
        containerEl.createEl('h4', { text: 'Custom Schema Fields' });
        const customFieldsContainer = containerEl.createDiv('custom-fields-container');
        this.renderCustomFields(customFieldsContainer);

        // Add new field button
        new Setting(containerEl)
            .setName('Add new schema field')
            .setDesc('Create a new custom field for atomic tasks')
            .addButton(button => button
                .setButtonText('Add field')
                .onClick(() => {
                    new CustomFieldModal(this.app, this.plugin, (field) => {
                        this.plugin.settings.customSchemaFields.push(field);
                        this.plugin.saveSettings();
                        this.renderCustomFields(customFieldsContainer);
                    }).open();
                })
            );
    }

    private renderStatusConfiguration(container: HTMLElement): void {
        new ListEditorComponent<StatusConfig>({
            container,
            items: this.plugin.settings.statusConfigs,
            headers: ['Status Value', 'Display Label', 'Color', 'Completed', 'Actions'],
            className: 'status-config',
            onItemsChange: async (items) => {
                this.plugin.settings.statusConfigs = items;
                await this.plugin.saveSettings();
                // Refresh the display to update dropdowns
                this.display();
            },
            renderItem: (itemContainer, item, index, updateItem, deleteItem) => {
                // Status value input
                const valueCell = itemContainer.createDiv('settings-view__cell');
                const valueInput = valueCell.createEl('input', {
                    type: 'text',
                    value: item.value,
                    placeholder: 'e.g., in_progress'
                });
                valueInput.addEventListener('input', () => {
                    updateItem({ value: valueInput.value.toLowerCase().replace(/[^a-z0-9_]/g, '') });
                });

                // Display label input
                const labelCell = itemContainer.createDiv('settings-view__cell');
                const labelInput = labelCell.createEl('input', {
                    type: 'text',
                    value: item.label,
                    placeholder: 'e.g., In Progress'
                });
                labelInput.addEventListener('input', () => {
                    updateItem({ label: labelInput.value });
                });

                // Color picker
                const colorCell = itemContainer.createDiv('settings-view__cell');
                const colorInput = colorCell.createEl('input', {
                    type: 'color',
                    value: item.color
                });
                colorInput.addEventListener('input', () => {
                    updateItem({ color: colorInput.value });
                });

                // Completed checkbox
                const completedCell = itemContainer.createDiv('settings-view__cell');
                const completedInput = completedCell.createEl('input', {
                    type: 'checkbox'
                });
                completedInput.checked = item.isCompleted;
                completedInput.addEventListener('change', () => {
                    updateItem({ isCompleted: completedInput.checked });
                });

                // Actions
                const actionsCell = itemContainer.createDiv('settings-view__cell');
                const deleteButton = actionsCell.createEl('button', {
                    text: '×',
                    cls: 'clickable-icon',
                    attr: { 'aria-label': 'Delete status' }
                });
                deleteButton.addEventListener('click', deleteItem);
            },
            canDelete: (item) => this.plugin.settings.statusConfigs.length > 2, // Minimum 2 statuses
            minItems: 2,
            dragEnabled: true,
            addButtonText: 'Add Status',
            createNewItem: () => {
                const existingOrders = this.plugin.settings.statusConfigs.map(s => s.order);
                const maxOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : 0;
                return {
                    id: `status-${Date.now()}`,
                    value: 'new_status',
                    label: 'New Status',
                    color: '#808080',
                    isCompleted: false,
                    order: maxOrder + 1
                };
            }
        });
    }

    private renderCustomFields(container: HTMLElement): void {
        container.empty();

        if (this.plugin.settings.customSchemaFields.length === 0) {
            container.createEl('p', {
                text: 'No custom fields configured. Click "Add field" to create your first custom schema field.',
                cls: 'setting-item-description'
            });
            return;
        }

        this.plugin.settings.customSchemaFields.forEach((field, index) => {
            const fieldContainer = container.createDiv('custom-field-item');

            // Field header with name and type
            const fieldHeader = fieldContainer.createDiv('custom-field-header');
            fieldHeader.createEl('strong', { text: field.displayName || field.key });
            fieldHeader.createEl('span', {
                text: ` (${field.key}: ${field.type}${field.required ? ', required' : ''})`,
                cls: 'custom-field-meta'
            });

            // Field description
            if (field.description) {
                fieldContainer.createEl('p', {
                    text: field.description,
                    cls: 'custom-field-description'
                });
            }

            // Field actions
            const fieldActions = fieldContainer.createDiv('custom-field-actions');

            // Edit button
            fieldActions.createEl('button', { text: 'Edit' })
                .addEventListener('click', () => {
                    new CustomFieldModal(this.app, this.plugin, (editedField) => {
                        this.plugin.settings.customSchemaFields[index] = editedField;
                        this.plugin.saveSettings();
                        this.renderCustomFields(container);
                    }, field).open();
                });

            // Delete button
            fieldActions.createEl('button', { text: 'Delete', cls: 'mod-warning' })
                .addEventListener('click', () => {
                    if (confirm(`Are you sure you want to delete the field "${field.displayName || field.key}"?`)) {
                        this.plugin.settings.customSchemaFields.splice(index, 1);
                        this.plugin.saveSettings();
                        this.renderCustomFields(container);
                    }
                });
        });
    }
}

class CustomFieldModal extends Modal {
    private field: CustomSchemaField;
    private onSave: (field: CustomSchemaField) => void;
    private plugin: TaskSystemPlugin;

    constructor(
        app: App,
        plugin: TaskSystemPlugin,
        onSave: (field: CustomSchemaField) => void,
        existingField?: CustomSchemaField
    ) {
        super(app);
        this.plugin = plugin;
        this.onSave = onSave;
        this.field = existingField ? { ...existingField } : {
            id: `field_${Date.now()}`,
            displayName: '',
            key: '',
            type: 'text',
            required: false
        };
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: this.field.id.startsWith('field_') ? 'Add Custom Field' : 'Edit Custom Field' });

        // Display Name
        new Setting(contentEl)
            .setName('Display Name')
            .setDesc('Human-readable name shown in UI')
            .addText(text => text
                .setPlaceholder('e.g., Project Phase')
                .setValue(this.field.displayName)
                .onChange(value => {
                    this.field.displayName = value;
                    // Auto-generate key if it's empty or matches the old display name
                    if (!this.field.key || this.field.key === this.field.displayName.toLowerCase().replace(/\s+/g, '_')) {
                        this.field.key = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                        keyInput.setValue(this.field.key);
                    }
                })
            );

        // Frontmatter Key
        let keyInput: TextComponent;
        new Setting(contentEl)
            .setName('Frontmatter Key')
            .setDesc('The key used in frontmatter (lowercase, underscores allowed)')
            .addText(text => {
                keyInput = text;
                return text
                    .setPlaceholder('e.g., project_phase')
                    .setValue(this.field.key)
                    .onChange(value => {
                        this.field.key = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        text.setValue(this.field.key);
                    });
            });

        // Field Type
        new Setting(contentEl)
            .setName('Field Type')
            .setDesc('Data type for this field')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'text': 'Text',
                    'number': 'Number',
                    'date': 'Date',
                    'boolean': 'Boolean',
                    'list': 'List',
                    'enum': 'Enum (predefined values)'
                })
                .setValue(this.field.type)
                .onChange(value => {
                    this.field.type = value as any;
                    this.updateEnumValuesVisibility();
                })
            );

        // Required toggle
        new Setting(contentEl)
            .setName('Required')
            .setDesc('Whether this field is required for all atomic tasks')
            .addToggle(toggle => toggle
                .setValue(this.field.required)
                .onChange(value => {
                    this.field.required = value;
                })
            );

        // Default Value
        new Setting(contentEl)
            .setName('Default Value')
            .setDesc('Default value when auto-populating (optional)')
            .addText(text => text
                .setPlaceholder('Leave empty for no default')
                .setValue(this.field.defaultValue || '')
                .onChange(value => {
                    this.field.defaultValue = value || undefined;
                })
            );

        // Enum Values (shown only for enum type)
        const enumContainer = contentEl.createDiv('enum-values-container');
        this.updateEnumValuesVisibility();

        // Description
        new Setting(contentEl)
            .setName('Description')
            .setDesc('Optional description of this field')
            .addTextArea(text => text
                .setPlaceholder('e.g., The current phase of the project')
                .setValue(this.field.description || '')
                .onChange(value => {
                    this.field.description = value || undefined;
                })
            );

        // Action buttons
        const buttonContainer = contentEl.createDiv('modal-button-container');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '20px';

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.addEventListener('click', () => this.close());

        const saveButton = buttonContainer.createEl('button', { text: 'Save', cls: 'mod-cta' });
        saveButton.addEventListener('click', () => {
            if (this.validateField()) {
                this.onSave(this.field);
                this.close();
            }
        });
    }

    private updateEnumValuesVisibility() {
        const enumContainer = this.contentEl.querySelector('.enum-values-container') as HTMLElement;
        if (!enumContainer) return;

        enumContainer.empty();

        if (this.field.type === 'enum') {
            enumContainer.createEl('h4', { text: 'Enum Values' });
            enumContainer.createEl('p', {
                text: 'Enter the allowed values for this enum field (one per line):',
                cls: 'setting-item-description'
            });

            const textarea = enumContainer.createEl('textarea', {
                placeholder: 'e.g.:\nplanning\nin-progress\ncompleted\nstalled'
            });
            textarea.style.width = '100%';
            textarea.style.minHeight = '100px';
            textarea.value = (this.field.enumValues || []).join('\n');

            textarea.addEventListener('input', () => {
                const values = textarea.value
                    .split('\n')
                    .map(v => v.trim())
                    .filter(v => v.length > 0);
                this.field.enumValues = values.length > 0 ? values : undefined;
            });
        }
    }

    private validateField(): boolean {
        if (!this.field.displayName.trim()) {
            alert('Display Name is required');
            return false;
        }

        if (!this.field.key.trim()) {
            alert('Frontmatter Key is required');
            return false;
        }

        // Check for duplicate keys
        const existingField = this.plugin.settings.customSchemaFields.find(
            f => f.key === this.field.key && f.id !== this.field.id
        );
        if (existingField) {
            alert(`A field with key "${this.field.key}" already exists`);
            return false;
        }

        // Check that key doesn't conflict with core fields
        const coreFields = getCoreSchemaFields(this.plugin.settings.statusConfigs);
        const coreKeys = coreFields.map(f => f.name);
        if (coreKeys.includes(this.field.key)) {
            alert(`The key "${this.field.key}" is reserved for core fields`);
            return false;
        }

        if (this.field.type === 'enum' && (!this.field.enumValues || this.field.enumValues.length === 0)) {
            alert('Enum fields must have at least one allowed value');
            return false;
        }

        return true;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}