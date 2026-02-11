import { Notice } from 'obsidian';

export type ErrorSeverity = 'low' | 'medium' | 'high';

export interface TranslatedError {
    message: string;
    canRetry: boolean;
    severity: ErrorSeverity;
    originalError?: any;
}

export class ErrorHandler {
    private static instance: ErrorHandler;
    private errorLog: Array<{ error: any; timestamp: number; context?: string }> = [];

    private constructor() {}

    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    /**
     * Translate an error into a user-friendly message
     */
    translateError(error: any): TranslatedError {
        // Handle different error types
        if (error instanceof Error) {
            const message = error.message.toLowerCase();

            // Rate limit errors
            if (message.includes('rate limit') || message.includes('too many requests')) {
                return {
                    message: 'Rate limit exceeded. Please wait a moment and try again.',
                    canRetry: true,
                    severity: 'medium',
                    originalError: error
                };
            }

            // Network errors
            if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
                return {
                    message: 'Network error. Please check your internet connection and try again.',
                    canRetry: true,
                    severity: 'medium',
                    originalError: error
                };
            }

            // API errors
            if (message.includes('api') || message.includes('unauthorized') || message.includes('401')) {
                return {
                    message: 'API authentication error. Please check your API key in settings.',
                    canRetry: false,
                    severity: 'high',
                    originalError: error
                };
            }

            // Timeout errors
            if (message.includes('timeout') || message.includes('timed out')) {
                return {
                    message: 'Request timed out. Please try again.',
                    canRetry: true,
                    severity: 'low',
                    originalError: error
                };
            }

            // File errors
            if (message.includes('file') || message.includes('read') || message.includes('write')) {
                return {
                    message: 'File operation error. Please check file permissions.',
                    canRetry: true,
                    severity: 'high',
                    originalError: error
                };
            }

            // Generic error
            return {
                message: error.message || 'An unknown error occurred.',
                canRetry: true,
                severity: 'medium',
                originalError: error
            };
        }

        // Handle string errors
        if (typeof error === 'string') {
            return {
                message: error,
                canRetry: true,
                severity: 'medium',
                originalError: error
            };
        }

        // Handle unknown error types
        return {
            message: 'An unknown error occurred.',
            canRetry: true,
            severity: 'medium',
            originalError: error
        };
    }

    /**
     * Execute an operation with retry logic and exponential backoff
     */
    async withRetry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        initialDelay: number = 1000,
        context?: string
    ): Promise<T> {
        let lastError: any;
        let delay = initialDelay;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                const translated = this.translateError(error);

                // Log the error
                this.log(error, context);

                // If error is not retryable, throw immediately
                if (!translated.canRetry) {
                    this.showUserNotification(error, context);
                    throw error;
                }

                // If this is the last attempt, throw the error
                if (attempt === maxRetries) {
                    this.showUserNotification(error, context);
                    throw error;
                }

                // Wait before retrying with exponential backoff
                await this.sleep(delay);
                delay *= 2; // Exponential backoff
            }
        }

        // This should never be reached, but TypeScript needs it
        throw lastError;
    }

    /**
     * Handle an error with logging and user notification
     */
    handle(error: any, context?: string): void {
        this.log(error, context);
        this.showUserNotification(error, context);
    }

    /**
     * Log an error to the error log
     */
    log(error: any, context?: string): void {
        this.errorLog.push({
            error,
            timestamp: Date.now(),
            context
        });

        // Keep only last 100 errors
        if (this.errorLog.length > 100) {
            this.errorLog.shift();
        }

        // Also log to console for debugging
        console.error(`[Perplexity Plugin]${context ? ` [${context}]` : ''}:`, error);
    }

    /**
     * Show a user-friendly notification for an error
     */
    showUserNotification(error: any, context?: string): void {
        const translated = this.translateError(error);
        const message = context ? `${context}: ${translated.message}` : translated.message;

        // Show notice based on severity
        const duration = translated.severity === 'high' ? 8000 : 5000;
        new Notice(message, duration);
    }

    /**
     * Get recent errors from the log
     */
    getRecentErrors(count: number = 10): Array<{ error: any; timestamp: number; context?: string }> {
        return this.errorLog.slice(-count);
    }

    /**
     * Clear the error log
     */
    clearErrorLog(): void {
        this.errorLog = [];
    }

    /**
     * Sleep for a specified number of milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if an error is retryable
     */
    isRetryable(error: any): boolean {
        return this.translateError(error).canRetry;
    }

    /**
     * Get error severity
     */
    getSeverity(error: any): ErrorSeverity {
        return this.translateError(error).severity;
    }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
