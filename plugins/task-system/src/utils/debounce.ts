export class DebounceManager {
    private static timers: Map<string, NodeJS.Timeout> = new Map();

    static debounce(key: string, callback: () => void, delay: number): void {
        const existingTimer = this.timers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
            callback();
            this.timers.delete(key);
        }, delay);

        this.timers.set(key, timer);
    }

    static debounceAsync(key: string, callback: () => Promise<void>, delay: number): void {
        const existingTimer = this.timers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(async () => {
            try {
                await callback();
            } catch (error) {
                console.error(`Debounced async operation failed for key ${key}:`, error);
            } finally {
                this.timers.delete(key);
            }
        }, delay);

        this.timers.set(key, timer);
    }

    static cancel(key: string): void {
        const timer = this.timers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(key);
        }
    }

    static cancelAll(): void {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
    }

    static isActive(key: string): boolean {
        return this.timers.has(key);
    }
}