import { TFile } from 'obsidian';
import { FrontmatterReader } from '../frontmatter/frontmatter.reader';
import { FrontmatterWriter } from '../frontmatter/frontmatter.writer';
import { SchemaValidator } from '../schema/schema.validator';
import { DefaultValueAssigner } from '../schema/schema.defaults';
import { NotificationManager } from '../ui/notification.manager';
import { DebounceManager } from '../utils/debounce';
import { Logger } from '../utils/logger';
import type TaskSystemPlugin from '../main';

export class FileEventHandler {
    private frontmatterReader: FrontmatterReader;
    private frontmatterWriter: FrontmatterWriter;

    constructor(private plugin: TaskSystemPlugin) {
        this.frontmatterReader = new FrontmatterReader(plugin.app);
        this.frontmatterWriter = new FrontmatterWriter(plugin.app);
    }

    registerEventHandlers(): void {
        // File creation handler
        this.plugin.registerEvent(
            this.plugin.app.vault.on('create', this.onFileCreated.bind(this))
        );

        // File modification handler
        this.plugin.registerEvent(
            this.plugin.app.vault.on('modify', this.onFileModified.bind(this))
        );

        Logger.debug('File event handlers registered');
    }

    private async onFileCreated(file: TFile): Promise<void> {
        if (!this.isMarkdownFile(file)) return;

        Logger.debug(`File created: ${file.name}`);

        // Use debouncing to handle rapid file operations
        DebounceManager.debounceAsync(
            `validate-${file.path}`,
            () => this.processFile(file, 'created'),
            this.plugin.settings.validationDelay
        );
    }

    private async onFileModified(file: TFile): Promise<void> {
        if (!this.isMarkdownFile(file)) return;

        Logger.debug(`File modified: ${file.name}`);

        // Use debouncing to handle rapid file modifications
        DebounceManager.debounceAsync(
            `validate-${file.path}`,
            () => this.processFile(file, 'modified'),
            this.plugin.settings.validationDelay
        );
    }

    private async processFile(file: TFile, eventType: 'created' | 'modified'): Promise<void> {
        try {
            const frontmatter = await this.frontmatterReader.readFrontmatter(file);

            if (!frontmatter || !this.frontmatterReader.isAtomicNote(frontmatter)) {
                Logger.debug(`Skipping non-atomic note: ${file.name}`);
                return;
            }

            Logger.debug(`Processing atomic note: ${file.name}`);
            await this.validateAndPopulate(file, frontmatter);

        } catch (error) {
            Logger.error(`Failed to process file ${file.name}:`, error as Error);
            NotificationManager.showErrorMessage(`Failed to process "${file.name}": ${(error as Error).message}`);
        }
    }

    private async validateAndPopulate(file: TFile, frontmatter: Record<string, any>): Promise<void> {
        let wasUpdated = false;

        // Auto-populate missing fields if enabled
        if (this.plugin.settings.autoPopulateDefaults) {
            const updatedFrontmatter = DefaultValueAssigner.assignDefaults(
                frontmatter,
                file.name,
                this.plugin.settings
            );

            // Check if any fields were actually updated
            const fieldsUpdated = this.getUpdatedFields(frontmatter, updatedFrontmatter);

            if (fieldsUpdated.length > 0) {
                Logger.debug(`Auto-populating fields for ${file.name}: ${fieldsUpdated.join(', ')}`);

                try {
                    await this.frontmatterWriter.writeFrontmatter(file, updatedFrontmatter);
                    wasUpdated = true;

                    // Show notification about auto-populated fields
                    NotificationManager.showAutoPopulateMessage(file.name, fieldsUpdated);

                    // Use updated frontmatter for validation
                    frontmatter = updatedFrontmatter;
                } catch (error) {
                    Logger.error(`Failed to write frontmatter for ${file.name}:`, error as Error);
                    NotificationManager.showErrorMessage(`Failed to update "${file.name}": ${(error as Error).message}`);
                    return;
                }
            }
        }

        // Only validate if we haven't just updated (to avoid immediate re-validation)
        // or if validation is explicitly enabled and we didn't auto-populate
        if (!wasUpdated && this.plugin.settings.enableValidation) {
            const validationResult = SchemaValidator.validate(frontmatter, this.plugin.settings.customSchemaFields);

            if (!validationResult.isValid || validationResult.warnings.length > 0) {
                Logger.debug(`Validation issues found for ${file.name}:`, validationResult);
                NotificationManager.showValidationWarnings(file.name, validationResult);
            } else if (this.plugin.settings.showSuccessNotifications) {
                NotificationManager.showSuccessMessage(file.name);
            }
        }
    }

    private getUpdatedFields(original: Record<string, any>, updated: Record<string, any>): string[] {
        const fieldsUpdated: string[] = [];

        for (const [key, value] of Object.entries(updated)) {
            if (JSON.stringify(original[key]) !== JSON.stringify(value)) {
                fieldsUpdated.push(key);
            }
        }

        return fieldsUpdated;
    }

    private isMarkdownFile(file: TFile): boolean {
        return file.extension === 'md';
    }

    async validateCurrentFile(): Promise<boolean> {
        const activeFile = this.plugin.app.workspace.getActiveFile();

        if (!activeFile || !this.isMarkdownFile(activeFile)) {
            NotificationManager.showErrorMessage('No active markdown file to validate');
            return false;
        }

        try {
            const frontmatter = await this.frontmatterReader.readFrontmatter(activeFile);

            if (!frontmatter || !this.frontmatterReader.isAtomicNote(frontmatter)) {
                NotificationManager.showInfoMessage(`"${activeFile.name}" is not an atomic task note`);
                return false;
            }

            const validationResult = SchemaValidator.validate(frontmatter, this.plugin.settings.customSchemaFields);

            if (validationResult.isValid && validationResult.warnings.length === 0) {
                NotificationManager.showSuccessMessage(activeFile.name);
                return true;
            } else {
                NotificationManager.showValidationWarnings(activeFile.name, validationResult);
                return false;
            }

        } catch (error) {
            Logger.error(`Failed to validate current file:`, error as Error);
            NotificationManager.showErrorMessage(`Validation failed: ${(error as Error).message}`);
            return false;
        }
    }

    async convertCurrentFileToAtomicTask(): Promise<boolean> {
        const activeFile = this.plugin.app.workspace.getActiveFile();

        if (!activeFile || !this.isMarkdownFile(activeFile)) {
            NotificationManager.showErrorMessage('No active markdown file to convert');
            return false;
        }

        try {
            const frontmatter = await this.frontmatterReader.readFrontmatter(activeFile) || {};

            // Set as atomic note
            frontmatter['atomic-task'] = true;

            // Assign defaults
            const updatedFrontmatter = DefaultValueAssigner.assignDefaults(
                frontmatter,
                activeFile.name,
                this.plugin.settings
            );

            await this.frontmatterWriter.writeFrontmatter(activeFile, updatedFrontmatter);

            const fieldsAdded = this.getUpdatedFields(frontmatter, updatedFrontmatter);
            NotificationManager.showInfoMessage(
                `Converted "${activeFile.name}" to atomic task. Added: ${fieldsAdded.join(', ')}`
            );

            return true;

        } catch (error) {
            Logger.error(`Failed to convert file to atomic task:`, error as Error);
            NotificationManager.showErrorMessage(`Conversion failed: ${(error as Error).message}`);
            return false;
        }
    }
}