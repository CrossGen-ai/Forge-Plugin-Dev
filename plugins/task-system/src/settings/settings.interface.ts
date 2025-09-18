import { TaskStatus, Priority } from '../schema/schema.definition';

export interface TaskSystemSettings {
    enableValidation: boolean;
    autoPopulateDefaults: boolean;
    validationMode: 'warn' | 'strict';
    defaultStatus: TaskStatus;
    defaultPriority: Priority;
    dateFormat: string;
    showSuccessNotifications: boolean;
    validationDelay: number; // ms delay for debouncing
}

export const DEFAULT_SETTINGS: TaskSystemSettings = {
    enableValidation: true,
    autoPopulateDefaults: true,
    validationMode: 'warn',
    defaultStatus: 'todo',
    defaultPriority: 'medium',
    dateFormat: 'YYYY-MM-DD',
    showSuccessNotifications: false,
    validationDelay: 500
};