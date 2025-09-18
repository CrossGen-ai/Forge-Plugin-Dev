export class Logger {
    private static isDebugMode(): boolean {
        return process.env.NODE_ENV === 'development';
    }

    static debug(message: string, data?: any): void {
        if (this.isDebugMode()) {
            console.log(`[TaskSystem] DEBUG: ${message}`, data);
        }
    }

    static info(message: string, data?: any): void {
        console.log(`[TaskSystem] INFO: ${message}`, data);
    }

    static error(message: string, error?: Error): void {
        console.error(`[TaskSystem] ERROR: ${message}`, error);
    }

    static warn(message: string, data?: any): void {
        console.warn(`[TaskSystem] WARN: ${message}`, data);
    }
}