import { REQUIRED_FIELDS, VALID_STATUS_VALUES, VALID_PRIORITY_VALUES } from './schema.definition';
import { DateUtils } from '../utils/date.utils';

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface ValidationWarning {
    field: string;
    message: string;
    severity: 'warning';
}

export class SchemaValidator {
    static validate(frontmatter: Record<string, any>): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // First check if this is an atomic note
        if (!frontmatter['atomic-task']) {
            return result; // Not an atomic note, no validation needed
        }

        // Check required fields
        for (const field of REQUIRED_FIELDS) {
            if (!frontmatter.hasOwnProperty(field) ||
                frontmatter[field] === null ||
                frontmatter[field] === undefined ||
                frontmatter[field] === '') {
                result.errors.push({
                    field,
                    message: `Required field '${field}' is missing or empty`,
                    severity: 'error'
                });
                result.isValid = false;
            }
        }

        // Validate field types and values
        this.validateFieldTypes(frontmatter, result);
        this.validateDateFields(frontmatter, result);
        this.validateEnumFields(frontmatter, result);
        this.validateLogicalRules(frontmatter, result);

        return result;
    }

    private static validateFieldTypes(frontmatter: Record<string, any>, result: ValidationResult): void {
        // Validate atomic-task is boolean
        if (frontmatter['atomic-task'] !== undefined && typeof frontmatter['atomic-task'] !== 'boolean') {
            result.errors.push({
                field: 'atomic-task',
                message: 'atomic-task must be a boolean (true or false)',
                severity: 'error'
            });
            result.isValid = false;
        }

        // Validate title is string
        if (frontmatter.title !== undefined && typeof frontmatter.title !== 'string') {
            result.errors.push({
                field: 'title',
                message: 'title must be a string',
                severity: 'error'
            });
            result.isValid = false;
        }

        // Validate arrays
        if (frontmatter.tags !== undefined && !Array.isArray(frontmatter.tags)) {
            result.errors.push({
                field: 'tags',
                message: 'tags must be an array',
                severity: 'error'
            });
            result.isValid = false;
        }

        if (frontmatter.dependencies !== undefined && !Array.isArray(frontmatter.dependencies)) {
            result.errors.push({
                field: 'dependencies',
                message: 'dependencies must be an array',
                severity: 'error'
            });
            result.isValid = false;
        }
    }

    private static validateDateFields(frontmatter: Record<string, any>, result: ValidationResult): void {
        const dateFields = ['created_date', 'due_date', 'completed_date'];

        for (const field of dateFields) {
            if (frontmatter[field] !== undefined && frontmatter[field] !== '') {
                // Check if it's a Date object (which should be converted) or invalid string
                if (frontmatter[field] instanceof Date) {
                    // This is a Date object, which means YAML parsing converted it
                    // We should accept this but it will be normalized later
                    continue;
                } else if (typeof frontmatter[field] === 'string' && !DateUtils.isValidDateString(frontmatter[field])) {
                    result.errors.push({
                        field,
                        message: `${field} must be a valid date in YYYY-MM-DD format`,
                        severity: 'error'
                    });
                    result.isValid = false;
                }
            }
        }
    }

    private static validateEnumFields(frontmatter: Record<string, any>, result: ValidationResult): void {
        // Validate status
        if (frontmatter.status !== undefined && !VALID_STATUS_VALUES.includes(frontmatter.status)) {
            result.errors.push({
                field: 'status',
                message: `status must be one of: ${VALID_STATUS_VALUES.join(', ')}`,
                severity: 'error'
            });
            result.isValid = false;
        }

        // Validate priority
        if (frontmatter.priority !== undefined && frontmatter.priority !== '' && !VALID_PRIORITY_VALUES.includes(frontmatter.priority)) {
            result.errors.push({
                field: 'priority',
                message: `priority must be one of: ${VALID_PRIORITY_VALUES.join(', ')}`,
                severity: 'error'
            });
            result.isValid = false;
        }
    }

    private static validateLogicalRules(frontmatter: Record<string, any>, result: ValidationResult): void {
        // Warn if completed_date is set but status is not 'done'
        if (frontmatter.completed_date && frontmatter.status !== 'done') {
            result.warnings.push({
                field: 'completed_date',
                message: 'completed_date is set but status is not "done"',
                severity: 'warning'
            });
        }

        // Warn if status is 'done' but no completed_date
        if (frontmatter.status === 'done' && !frontmatter.completed_date) {
            result.warnings.push({
                field: 'completed_date',
                message: 'status is "done" but completed_date is not set',
                severity: 'warning'
            });
        }

        // Warn if due_date is in the past and status is not 'done'
        if (frontmatter.due_date && frontmatter.status !== 'done') {
            const dueDate = DateUtils.parseDate(frontmatter.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time for date comparison

            if (dueDate && dueDate < today) {
                result.warnings.push({
                    field: 'due_date',
                    message: 'due_date is in the past',
                    severity: 'warning'
                });
            }
        }
    }

    static getValidationSummary(result: ValidationResult): string {
        if (result.isValid && result.warnings.length === 0) {
            return 'Schema validation passed';
        }

        const parts: string[] = [];

        if (result.errors.length > 0) {
            parts.push(`${result.errors.length} error${result.errors.length > 1 ? 's' : ''}`);
        }

        if (result.warnings.length > 0) {
            parts.push(`${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''}`);
        }

        return `Schema validation: ${parts.join(', ')}`;
    }
}