import type { CustomSchemaField } from '../settings/settings.interface';

export interface AtomicTaskSchema {
    'atomic-task': boolean;     // Required (with quotes because of hyphen)
    title: string;              // Required
    created_date: string;       // Required (ISO date)
    status: TaskStatus;         // Required
    [key: string]: any;         // Allow additional custom fields
}

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type Priority = 'low' | 'medium' | 'high';

// Core required fields that cannot be changed by users
export const CORE_REQUIRED_FIELDS = ['atomic-task', 'title', 'created_date', 'status'] as const;

export const VALID_STATUS_VALUES: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done'];
export const VALID_PRIORITY_VALUES: Priority[] = ['low', 'medium', 'high'];

export interface SchemaField {
    name: string;
    type: 'boolean' | 'string' | 'date' | 'enum' | 'array' | 'text' | 'number' | 'list';
    required: boolean;
    defaultValue?: any;
    enumValues?: string[];
    displayName?: string;
    description?: string;
}

// Core schema fields that are always present
export const CORE_SCHEMA_FIELDS: SchemaField[] = [
    {
        name: 'atomic-task',
        type: 'boolean',
        required: true,
        displayName: 'Atomic Task',
        description: 'Marks this note as an atomic task'
    },
    {
        name: 'title',
        type: 'string',
        required: true,
        displayName: 'Title',
        description: 'Task title'
    },
    {
        name: 'created_date',
        type: 'date',
        required: true,
        displayName: 'Created Date',
        description: 'When the task was created'
    },
    {
        name: 'status',
        type: 'enum',
        required: true,
        enumValues: VALID_STATUS_VALUES,
        defaultValue: 'todo',
        displayName: 'Status',
        description: 'Current task status'
    }
];

/**
 * Get combined schema fields (core + custom)
 */
export function getCombinedSchemaFields(customFields: CustomSchemaField[]): SchemaField[] {
    const combinedFields = [...CORE_SCHEMA_FIELDS];

    // Convert custom fields to schema fields
    customFields.forEach(customField => {
        combinedFields.push({
            name: customField.key,
            type: customField.type as any, // Type mapping handled in validator
            required: customField.required,
            defaultValue: customField.defaultValue,
            enumValues: customField.enumValues,
            displayName: customField.displayName,
            description: customField.description
        });
    });

    return combinedFields;
}

/**
 * Get all required field names (core + custom required fields)
 */
export function getRequiredFields(customFields: CustomSchemaField[]): string[] {
    const requiredFields = [...CORE_REQUIRED_FIELDS];

    customFields.forEach(field => {
        if (field.required) {
            requiredFields.push(field.key);
        }
    });

    return requiredFields;
}

/**
 * Legacy SCHEMA_FIELDS export for backward compatibility
 * @deprecated Use getCombinedSchemaFields() instead
 */
export const SCHEMA_FIELDS: SchemaField[] = CORE_SCHEMA_FIELDS;