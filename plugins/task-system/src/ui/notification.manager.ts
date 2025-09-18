import { Notice } from 'obsidian';
import { ValidationResult } from '../schema/schema.validator';

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

    static showAutoPopulateMessage(filename: string, fieldsUpdated: string[]): void {
        if (fieldsUpdated.length > 0) {
            const fieldList = fieldsUpdated.join(', ');
            new Notice(
                `Auto-populated fields for "${filename}": ${fieldList}`,
                4000
            );
        }
    }

    static showErrorMessage(message: string, duration = 5000): void {
        new Notice(`Error: ${message}`, duration);
    }

    static showInfoMessage(message: string, duration = 3000): void {
        new Notice(message, duration);
    }

    static formatValidationErrors(result: ValidationResult): string[] {
        const messages: string[] = [];

        if (result.errors.length > 0) {
            messages.push(`Errors (${result.errors.length}):`);
            result.errors.forEach(error => {
                messages.push(`  • ${error.field}: ${error.message}`);
            });
        }

        if (result.warnings.length > 0) {
            messages.push(`Warnings (${result.warnings.length}):`);
            result.warnings.forEach(warning => {
                messages.push(`  • ${warning.field}: ${warning.message}`);
            });
        }

        return messages;
    }

    static createDetailedNotice(title: string, details: string[], duration = 8000): void {
        const content = [title, ...details].join('\n');
        new Notice(content, duration);
    }
}