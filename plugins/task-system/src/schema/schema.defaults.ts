import { getCombinedSchemaFields } from './schema.definition';
import { DateUtils } from '../utils/date.utils';
import type { TaskSystemSettings, CustomSchemaField } from '../settings/settings.interface';

export class DefaultValueAssigner {
    static assignDefaults(
        frontmatter: Record<string, any>,
        filename: string,
        settings: TaskSystemSettings
    ): Record<string, any> {
        const updated = { ...frontmatter };

        // Auto-populate title from filename if missing
        if (!updated.title || updated.title === '') {
            updated.title = this.extractTitleFromFilename(filename);
        }

        // Auto-populate created_date ONLY if missing or empty (never overwrite existing dates)
        if (!updated.created_date || updated.created_date === '') {
            updated.created_date = DateUtils.formatCurrentDate();
            console.log(`[TaskSystem] Setting created_date to: ${updated.created_date} for file: ${filename}`);
        } else {
            // Convert Date objects to string format if needed
            if (updated.created_date instanceof Date) {
                updated.created_date = DateUtils.formatDate(updated.created_date);
                console.log(`[TaskSystem] Converted Date object to string: ${updated.created_date} for file: ${filename}`);
            } else {
                console.log(`[TaskSystem] Preserving existing created_date: ${updated.created_date} for file: ${filename}`);
            }
        }

        // Set default status if missing
        if (!updated.status || updated.status === '') {
            updated.status = settings.defaultStatus || 'todo';
        }

        // Apply defaults from custom schema fields
        this.applyCustomFieldDefaults(updated, settings.customSchemaFields, settings);

        // Normalize all date fields to string format for custom fields
        settings.customSchemaFields.forEach(field => {
            if (field.type === 'date' && updated[field.key] && updated[field.key] instanceof Date) {
                updated[field.key] = DateUtils.formatDate(updated[field.key]);
                console.log(`[TaskSystem] Normalized ${field.key} from Date object to string: ${updated[field.key]} for file: ${filename}`);
            }
        });

        return updated;
    }

    /**
     * Apply default values from custom schema fields
     */
    private static applyCustomFieldDefaults(
        frontmatter: Record<string, any>,
        customFields: CustomSchemaField[],
        settings: TaskSystemSettings
    ): void {
        if (!settings.autoPopulateDefaults) {
            return;
        }

        customFields.forEach(field => {
            // Only apply default if field is missing or empty and has a default value
            if (field.defaultValue !== undefined &&
                (!frontmatter.hasOwnProperty(field.key) ||
                 frontmatter[field.key] === null ||
                 frontmatter[field.key] === undefined ||
                 frontmatter[field.key] === '')) {
                frontmatter[field.key] = field.defaultValue;
            }
        });
    }

    private static extractTitleFromFilename(filename: string): string {
        return filename
            .replace(/\.md$/, '') // Remove .md extension
            .replace(/-/g, ' ')   // Replace hyphens with spaces
            .replace(/_/g, ' ')   // Replace underscores with spaces
            .trim();
    }

    private static shouldSetDefaultPriority(settings: TaskSystemSettings): boolean {
        return settings.autoPopulateDefaults;
    }

    static hasRequiredFields(frontmatter: Record<string, any>, customFields: CustomSchemaField[] = []): boolean {
        const requiredFields = this.getRequiredFieldNames(customFields);
        return requiredFields.every(field =>
            frontmatter.hasOwnProperty(field) &&
            frontmatter[field] !== null &&
            frontmatter[field] !== undefined &&
            frontmatter[field] !== ''
        );
    }

    static getMissingRequiredFields(frontmatter: Record<string, any>, customFields: CustomSchemaField[] = []): string[] {
        const requiredFields = this.getRequiredFieldNames(customFields);
        return requiredFields.filter(field =>
            !frontmatter.hasOwnProperty(field) ||
            frontmatter[field] === null ||
            frontmatter[field] === undefined ||
            frontmatter[field] === ''
        );
    }

    private static getRequiredFieldNames(customFields: CustomSchemaField[]): string[] {
        const coreRequired = ['atomic-task', 'title', 'created_date', 'status'];
        const customRequired = customFields.filter(f => f.required).map(f => f.key);
        return [...coreRequired, ...customRequired];
    }
}