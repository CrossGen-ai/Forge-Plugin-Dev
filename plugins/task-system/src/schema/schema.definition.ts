import type { CustomSchemaField, StatusConfig } from '../settings/settings.interface';

export interface AtomicTaskSchema {
    'atomic-task': boolean;     // Required (with quotes because of hyphen)
    title: string;              // Required
    created_date: string;       // Required (ISO date)
    status: string;             // Required - now dynamic based on settings
    ai_task: boolean;           // Required
    [key: string]: any;         // Allow additional custom fields
}

export type Priority = 'low' | 'medium' | 'high';

// Core required fields that cannot be changed by users
export const CORE_REQUIRED_FIELDS = ['atomic-task', 'title', 'created_date', 'status', 'ai_task'] as const;

export const VALID_PRIORITY_VALUES: Priority[] = ['low', 'medium', 'high'];

// Dynamic status values getter
export function getValidStatusValues(statusConfigs: StatusConfig[]): string[] {
    return statusConfigs.map(config => config.value);
}

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
export function getCoreSchemaFields(statusConfigs: StatusConfig[]): SchemaField[] {
    return [
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
            enumValues: getValidStatusValues(statusConfigs),
            defaultValue: statusConfigs[0]?.value || 'todo',
            displayName: 'Status',
            description: 'Current task status'
        },
        {
            name: 'ai_task',
            type: 'boolean',
            required: true,
            defaultValue: false,
            displayName: 'AI Task',
            description: 'Marks this task as AI-generated or AI-assisted'
        }
    ];
}

/**
 * Get combined schema fields (core + custom)
 */
export function getCombinedSchemaFields(statusConfigs: StatusConfig[], customFields: CustomSchemaField[]): SchemaField[] {
    const combinedFields = [...getCoreSchemaFields(statusConfigs)];

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
export function getLegacySchemaFields(statusConfigs: StatusConfig[]): SchemaField[] {
    return getCoreSchemaFields(statusConfigs);
}