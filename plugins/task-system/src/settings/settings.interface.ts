import { Priority } from '../schema/schema.definition';

export interface StatusConfig {
    id: string;
    value: string;
    label: string;
    color: string;
    isCompleted: boolean;
    order: number;
}

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
    statusConfigs: StatusConfig[];
    defaultStatus: string;
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

export const DEFAULT_STATUS_CONFIGS: StatusConfig[] = [
    {
        id: 'status-1',
        value: 'todo',
        label: 'To Do',
        color: '#ff6b6b',
        isCompleted: false,
        order: 1
    },
    {
        id: 'status-2',
        value: 'in_progress',
        label: 'In Progress',
        color: '#4ecdc4',
        isCompleted: false,
        order: 2
    },
    {
        id: 'status-3',
        value: 'blocked',
        label: 'Blocked',
        color: '#ffe66d',
        isCompleted: false,
        order: 3
    },
    {
        id: 'status-4',
        value: 'done',
        label: 'Done',
        color: '#95e1d3',
        isCompleted: true,
        order: 4
    }
];

export const DEFAULT_SETTINGS: TaskSystemSettings = {
    enableValidation: true,
    autoPopulateDefaults: true,
    validationMode: 'warn',
    statusConfigs: DEFAULT_STATUS_CONFIGS,
    defaultStatus: 'todo',
    defaultPriority: 'medium',
    dateFormat: 'YYYY-MM-DD',
    showSuccessNotifications: false,
    validationDelay: 500,
    customSchemaFields: DEFAULT_CUSTOM_SCHEMA_FIELDS
};