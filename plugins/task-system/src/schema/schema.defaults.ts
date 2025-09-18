import { DEFAULT_VALUES } from './schema.definition';
import { DateUtils } from '../utils/date.utils';
import { TaskSystemSettings } from '../settings/settings.interface';

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
            updated.status = settings.defaultStatus || DEFAULT_VALUES.status;
        }

        // Set default priority if missing and auto-populate is enabled
        if ((!updated.priority || updated.priority === '') && this.shouldSetDefaultPriority(settings)) {
            updated.priority = settings.defaultPriority || DEFAULT_VALUES.priority;
        }

        // Initialize empty arrays for tags and dependencies if missing
        if (!Array.isArray(updated.tags)) {
            updated.tags = DEFAULT_VALUES.tags;
        }

        if (!Array.isArray(updated.dependencies)) {
            updated.dependencies = DEFAULT_VALUES.dependencies;
        }

        // Normalize all date fields to string format
        const dateFields = ['due_date', 'completed_date'];
        dateFields.forEach(field => {
            if (updated[field] && updated[field] instanceof Date) {
                updated[field] = DateUtils.formatDate(updated[field]);
                console.log(`[TaskSystem] Normalized ${field} from Date object to string: ${updated[field]} for file: ${filename}`);
            }
        });

        return updated;
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

    static hasRequiredFields(frontmatter: Record<string, any>): boolean {
        const requiredFields = ['atomic-task', 'title', 'created_date', 'status'];
        return requiredFields.every(field =>
            frontmatter.hasOwnProperty(field) &&
            frontmatter[field] !== null &&
            frontmatter[field] !== undefined &&
            frontmatter[field] !== ''
        );
    }

    static getMissingRequiredFields(frontmatter: Record<string, any>): string[] {
        const requiredFields = ['atomic-task', 'title', 'created_date', 'status'];
        return requiredFields.filter(field =>
            !frontmatter.hasOwnProperty(field) ||
            frontmatter[field] === null ||
            frontmatter[field] === undefined ||
            frontmatter[field] === ''
        );
    }
}