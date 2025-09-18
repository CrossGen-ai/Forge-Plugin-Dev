import { TaskStatus, Priority } from '../schema/schema.definition';

export interface CustomSchemaField {
    id: string; // Unique identifier for the field
    displayName: string; // User-friendly name shown in UI
    key: string; // Frontmatter property key
    type: 'text' | 'number' | 'date' | 'boolean' | 'list' | 'enum';
    required: boolean; // Whether this field is required
    defaultValue?: any; // Default value for the field
    enumValues?: string[]; // Valid values for enum type
    description?: string; // Optional description for the field
}

export interface TaskSystemSettings {
    enableValidation: boolean;
    autoPopulateDefaults: boolean;
    validationMode: 'warn' | 'strict';
    defaultStatus: TaskStatus;
    defaultPriority: Priority;
    dateFormat: string;
    showSuccessNotifications: boolean;
    validationDelay: number; // ms delay for debouncing
    customSchemaFields: CustomSchemaField[]; // User-defined schema fields
}

export const DEFAULT_CUSTOM_SCHEMA_FIELDS: CustomSchemaField[] = [
    {
        id: 'priority',
        displayName: 'Priority',
        key: 'priority',
        type: 'enum',
        required: false,
        defaultValue: 'medium',
        enumValues: ['low', 'medium', 'high'],
        description: 'Task priority level'
    },
    {
        id: 'due_date',
        displayName: 'Due Date',
        key: 'due_date',
        type: 'date',
        required: false,
        description: 'When the task is due'
    },
    {
        id: 'tags',
        displayName: 'Tags',
        key: 'tags',
        type: 'list',
        required: false,
        defaultValue: [],
        description: 'Task tags for categorization'
    },
    {
        id: 'dependencies',
        displayName: 'Dependencies',
        key: 'dependencies',
        type: 'list',
        required: false,
        defaultValue: [],
        description: 'Links to dependent tasks or notes'
    },
    {
        id: 'completed_date',
        displayName: 'Completed Date',
        key: 'completed_date',
        type: 'date',
        required: false,
        description: 'When the task was completed'
    }
];

export const DEFAULT_SETTINGS: TaskSystemSettings = {
    enableValidation: true,
    autoPopulateDefaults: true,
    validationMode: 'warn',
    defaultStatus: 'todo',
    defaultPriority: 'medium',
    dateFormat: 'YYYY-MM-DD',
    showSuccessNotifications: false,
    validationDelay: 500,
    customSchemaFields: DEFAULT_CUSTOM_SCHEMA_FIELDS
};