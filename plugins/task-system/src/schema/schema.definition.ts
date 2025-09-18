export interface AtomicTaskSchema {
    'atomic-task': boolean;        // Required
    title: string;              // Required
    created_date: string;       // Required (ISO date)
    status: TaskStatus;         // Required
    priority?: Priority;        // Optional
    due_date?: string;         // Optional (ISO date)
    tags?: string[];           // Optional
    dependencies?: string[];    // Optional
    completed_date?: string;   // Optional (ISO date)
}

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export const REQUIRED_FIELDS = ['atomic-task', 'title', 'created_date', 'status'] as const;

export const DEFAULT_VALUES = {
    status: 'todo' as TaskStatus,
    priority: 'medium' as Priority,
    tags: [],
    dependencies: []
};

export const VALID_STATUS_VALUES: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done'];
export const VALID_PRIORITY_VALUES: Priority[] = ['low', 'medium', 'high'];

export interface SchemaField {
    name: string;
    type: 'boolean' | 'string' | 'date' | 'enum' | 'array';
    required: boolean;
    defaultValue?: any;
    enumValues?: string[];
}

export const SCHEMA_FIELDS: SchemaField[] = [
    { name: 'atomic-task', type: 'boolean', required: true },
    { name: 'title', type: 'string', required: true },
    { name: 'created_date', type: 'date', required: true },
    { name: 'status', type: 'enum', required: true, enumValues: VALID_STATUS_VALUES, defaultValue: 'todo' },
    { name: 'priority', type: 'enum', required: false, enumValues: VALID_PRIORITY_VALUES, defaultValue: 'medium' },
    { name: 'due_date', type: 'date', required: false },
    { name: 'tags', type: 'array', required: false, defaultValue: [] },
    { name: 'dependencies', type: 'array', required: false, defaultValue: [] },
    { name: 'completed_date', type: 'date', required: false }
];