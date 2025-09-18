import { getCombinedSchemaFields, getRequiredFields, CORE_REQUIRED_FIELDS, VALID_STATUS_VALUES, VALID_PRIORITY_VALUES } from './schema.definition';
import type { CustomSchemaField } from '../settings/settings.interface';
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
    /**
     * Validate frontmatter against dynamic schema
     */
    static validate(frontmatter: Record<string, any>, customFields: CustomSchemaField[] = []): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // First check if this is an atomic note
        if (!frontmatter['atomic-task']) {
            return result; // Not an atomic note, no validation needed
        }

        // Get combined schema fields
        const schemaFields = getCombinedSchemaFields(customFields);
        const requiredFields = getRequiredFields(customFields);

        // Check required fields
        for (const field of requiredFields) {
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

        // Validate each field according to its schema definition
        this.validateSchemaFields(frontmatter, schemaFields, result);
        this.validateLogicalRules(frontmatter, result);

        return result;
    }

    /**
     * Validate each field according to its schema definition
     */
    private static validateSchemaFields(
        frontmatter: Record<string, any>,
        schemaFields: Array<{ name: string; type: string; enumValues?: string[] }>,
        result: ValidationResult
    ): void {
        for (const field of schemaFields) {
            const value = frontmatter[field.name];

            // Skip validation if field is not present (already handled by required field check)
            if (value === undefined || value === null) {
                continue;
            }

            this.validateFieldType(field.name, value, field.type, field.enumValues, result);
        }
    }

    /**
     * Validate a single field's type and value
     */
    private static validateFieldType(
        fieldName: string,
        value: any,
        fieldType: string,
        enumValues: string[] | undefined,
        result: ValidationResult
    ): void {
        switch (fieldType) {
            case 'boolean':
                if (typeof value !== 'boolean') {
                    result.errors.push({
                        field: fieldName,
                        message: `${fieldName} must be a boolean (true or false)`,
                        severity: 'error'
                    });
                    result.isValid = false;
                }
                break;

            case 'string':
            case 'text':
                if (typeof value !== 'string') {
                    result.errors.push({
                        field: fieldName,
                        message: `${fieldName} must be a string`,
                        severity: 'error'
                    });
                    result.isValid = false;
                }
                break;

            case 'number':
                if (typeof value !== 'number' && !isNaN(Number(value))) {
                    result.errors.push({
                        field: fieldName,
                        message: `${fieldName} must be a number`,
                        severity: 'error'
                    });
                    result.isValid = false;
                }
                break;

            case 'date':
                // Check if it's a Date object (which should be converted) or invalid string
                if (value instanceof Date) {
                    // This is a Date object, which means YAML parsing converted it
                    // We should accept this but it will be normalized later
                    break;
                } else if (typeof value === 'string' && value !== '' && !DateUtils.isValidDateString(value)) {
                    result.errors.push({
                        field: fieldName,
                        message: `${fieldName} must be a valid date in YYYY-MM-DD format`,
                        severity: 'error'
                    });
                    result.isValid = false;
                }
                break;

            case 'array':
            case 'list':
                if (!Array.isArray(value)) {
                    result.errors.push({
                        field: fieldName,
                        message: `${fieldName} must be an array/list`,
                        severity: 'error'
                    });
                    result.isValid = false;
                }
                break;

            case 'enum':
                if (enumValues && !enumValues.includes(value)) {
                    result.errors.push({
                        field: fieldName,
                        message: `${fieldName} must be one of: ${enumValues.join(', ')}`,
                        severity: 'error'
                    });
                    result.isValid = false;
                }
                break;
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