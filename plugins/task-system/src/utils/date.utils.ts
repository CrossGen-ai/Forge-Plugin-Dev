export class DateUtils {
    static formatCurrentDate(): string {
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    static isValidDateString(dateStr: string): boolean {
        if (!dateStr || typeof dateStr !== 'string') return false;

        // Check ISO date format (YYYY-MM-DD)
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!isoDateRegex.test(dateStr)) return false;

        const date = new Date(dateStr);
        return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
    }

    static parseDate(dateStr: string): Date | null {
        if (!this.isValidDateString(dateStr)) return null;

        try {
            return new Date(dateStr);
        } catch {
            return null;
        }
    }

    static formatDate(date: Date, format = 'YYYY-MM-DD'): string {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            return '';
        }

        switch (format) {
            case 'YYYY-MM-DD':
                return date.toISOString().split('T')[0];
            case 'MM/DD/YYYY':
                return date.toLocaleDateString('en-US');
            case 'DD/MM/YYYY':
                return date.toLocaleDateString('en-GB');
            default:
                return date.toISOString().split('T')[0];
        }
    }
}