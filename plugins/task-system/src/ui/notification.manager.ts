import { Notice } from 'obsidian';
import { ValidationResult } from '../schema/schema.validator';

export class NotificationManager {
    static showValidationWarnings(filename: string, result: ValidationResult): void {
        if (result.errors.length > 0) {
            const errorCount = result.errors.length;
            new Notice(
                `Schema validation failed for "${filename}" - ${errorCount} error${errorCount > 1 ? 's' : ''}`,
                8000
            );

            // Show first few errors as separate notices
            result.errors.slice(0, 3).forEach((error, index) => {
                setTimeout(() => {
                    new Notice(`Error: ${error.field} - ${error.message}`, 6000);
                }, index * 1000);
            });
        }

        if (result.warnings.length > 0) {
            const warningCount = result.warnings.length;
            new Notice(
                `Schema warnings for "${filename}" - ${warningCount} warning${warningCount > 1 ? 's' : ''}`,
                5000
            );

            // Show first warning as separate notice
            if (result.warnings[0]) {
                setTimeout(() => {
                    new Notice(`Warning: ${result.warnings[0].field} - ${result.warnings[0].message}`, 4000);
                }, 500);
            }
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
        new Notice(title, duration);

        // Show details as separate notices with slight delay
        details.slice(0, 3).forEach((detail, index) => {
            setTimeout(() => {
                new Notice(detail, Math.max(3000, duration - 2000));
            }, (index + 1) * 800);
        });
    }
}