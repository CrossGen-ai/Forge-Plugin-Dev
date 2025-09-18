import { Notice } from 'obsidian';
import type TaskSystemPlugin from '../main';

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
                        plugin.fileEventHandler.validateCurrentFile();
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
                        plugin.fileEventHandler.convertCurrentFileToAtomicTask();
                    }
                    return true;
                }
                return false;
            }
        });

        // Toggle validation command
        plugin.addCommand({
            id: 'toggle-validation',
            name: 'Toggle schema validation on/off',
            callback: async () => {
                plugin.settings.enableValidation = !plugin.settings.enableValidation;
                await plugin.saveSettings();

                const status = plugin.settings.enableValidation ? 'enabled' : 'disabled';
                new Notice(`Schema validation ${status}`);
            }
        });

        // Toggle auto-populate command
        plugin.addCommand({
            id: 'toggle-auto-populate',
            name: 'Toggle auto-populate defaults on/off',
            callback: async () => {
                plugin.settings.autoPopulateDefaults = !plugin.settings.autoPopulateDefaults;
                await plugin.saveSettings();

                const status = plugin.settings.autoPopulateDefaults ? 'enabled' : 'disabled';
                new Notice(`Auto-populate defaults ${status}`);
            }
        });
    }
}