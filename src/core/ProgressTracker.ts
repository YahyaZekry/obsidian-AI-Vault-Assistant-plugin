import { App, Notice } from 'obsidian';

export interface ProgressOptions {
    showTimeRemaining?: boolean;
    showFilename?: boolean;
    onCancel?: () => void;
}

export class ProgressTracker {
    private container: HTMLElement | null = null;
    private total: number = 0;
    private current: number = 0;
    private startTime: number = 0;
    private progressBar: HTMLElement | null = null;
    private progressText: HTMLElement | null = null;
    private timeRemainingText: HTMLElement | null = null;
    private filenameText: HTMLElement | null = null;
    private cancelButton: HTMLElement | null = null;
    private options: ProgressOptions = {};
    private cancelled: boolean = false;

    /**
     * Show detailed progress in a container
     */
    showDetailedProgress(container: HTMLElement, total: number, options: ProgressOptions = {}): void {
        this.container = container;
        this.total = total;
        this.current = 0;
        this.startTime = Date.now();
        this.options = options;
        this.cancelled = false;

        // Clear container
        container.empty();

        // Create progress container
        const progressContainer = container.createDiv({ cls: 'perplexity-progress-container' });

        // Create progress bar wrapper
        const progressBarWrapper = progressContainer.createDiv({ cls: 'perplexity-progress-bar-wrapper' });
        this.progressBar = progressBarWrapper.createDiv({ cls: 'perplexity-progress-bar' });

        // Create progress text
        this.progressText = progressContainer.createDiv({ cls: 'perplexity-progress-text' });
        this.progressText.setText('0%');

        // Create time remaining text if enabled
        if (options.showTimeRemaining) {
            this.timeRemainingText = progressContainer.createDiv({ cls: 'perplexity-time-remaining' });
            this.timeRemainingText.setText('Calculating...');
        }

        // Create filename text if enabled
        if (options.showFilename) {
            this.filenameText = progressContainer.createDiv({ cls: 'perplexity-filename' });
            this.filenameText.setText('Starting...');
        }

        // Create cancel button if callback provided
        if (options.onCancel) {
            const buttonContainer = progressContainer.createDiv({ cls: 'perplexity-cancel-container' });
            this.cancelButton = buttonContainer.createEl('button', { cls: 'perplexity-cancel-button' });
            this.cancelButton.setText('Cancel');
            this.cancelButton.addEventListener('click', () => {
                this.cancelled = true;
                options.onCancel?.();
            });
        }
    }

    /**
     * Update progress with current count, message, and optional filename
     */
    update(current: number, message: string, filename?: string): void {
        if (this.cancelled) return;

        this.current = current;

        // Update progress bar
        if (this.progressBar) {
            const percentage = Math.min((current / this.total) * 100, 100);
            this.progressBar.style.width = `${percentage}%`;
        }

        // Update progress text
        if (this.progressText) {
            const percentage = Math.round((current / this.total) * 100);
            this.progressText.setText(`${percentage}% - ${message}`);
        }

        // Update time remaining
        if (this.timeRemainingText && this.options.showTimeRemaining) {
            const timeRemaining = this.calculateTimeRemaining();
            if (timeRemaining) {
                this.timeRemainingText.setText(`Time remaining: ${timeRemaining}`);
            } else {
                this.timeRemainingText.setText('Calculating...');
            }
        }

        // Update filename
        if (this.filenameText && this.options.showFilename && filename) {
            this.filenameText.setText(`Processing: ${filename}`);
        }
    }

    /**
     * Calculate estimated time remaining
     */
    private calculateTimeRemaining(): string | null {
        if (this.current === 0) return null;

        const elapsed = Date.now() - this.startTime;
        const avgTimePerItem = elapsed / this.current;
        const remaining = this.total - this.current;
        const estimatedRemaining = remaining * avgTimePerItem;

        return this.formatTime(estimatedRemaining);
    }

    /**
     * Format time in milliseconds to human-readable string
     */
    private formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Mark progress as complete
     */
    complete(message: string = 'Complete!'): void {
        if (this.cancelled) return;

        if (this.progressBar) {
            this.progressBar.style.width = '100%';
        }

        if (this.progressText) {
            this.progressText.setText(`100% - ${message}`);
        }

        if (this.timeRemainingText) {
            this.timeRemainingText.setText('');
        }

        if (this.filenameText) {
            this.filenameText.setText('');
        }

        if (this.cancelButton) {
            this.cancelButton.style.display = 'none';
        }
    }

    /**
     * Mark progress as failed
     */
    error(message: string): void {
        if (this.progressBar) {
            this.progressBar.style.width = '100%';
            this.progressBar.addClass('perplexity-progress-error');
        }

        if (this.progressText) {
            this.progressText.setText(`Error: ${message}`);
        }

        if (this.timeRemainingText) {
            this.timeRemainingText.setText('');
        }

        if (this.filenameText) {
            this.filenameText.setText('');
        }

        if (this.cancelButton) {
            this.cancelButton.style.display = 'none';
        }
    }

    /**
     * Check if operation was cancelled
     */
    isCancelled(): boolean {
        return this.cancelled;
    }

    /**
     * Reset the progress tracker
     */
    reset(): void {
        this.current = 0;
        this.startTime = Date.now();
        this.cancelled = false;

        if (this.progressBar) {
            this.progressBar.style.width = '0%';
            this.progressBar.removeClass('perplexity-progress-error');
        }

        if (this.progressText) {
            this.progressText.setText('0%');
        }

        if (this.timeRemainingText) {
            this.timeRemainingText.setText('Calculating...');
        }

        if (this.filenameText) {
            this.filenameText.setText('Starting...');
        }

        if (this.cancelButton) {
            this.cancelButton.style.display = 'block';
        }
    }

    /**
     * Clean up the progress tracker
     */
    destroy(): void {
        if (this.container) {
            this.container.empty();
        }
        this.container = null;
        this.progressBar = null;
        this.progressText = null;
        this.timeRemainingText = null;
        this.filenameText = null;
        this.cancelButton = null;
    }
}

/**
 * Create a modal with progress tracking
 */
export class ProgressModal {
    private modal: HTMLElement;
    private tracker: ProgressTracker;
    private notice: Notice | null = null;

    constructor(app: App, title: string, total: number, options: ProgressOptions = {}) {
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.addClass('perplexity-progress-modal');
        this.modal.createEl('h2', { text: title });

        // Create progress tracker
        this.tracker = new ProgressTracker();
        this.tracker.showDetailedProgress(this.modal, total, options);

        // Add to document body
        document.body.appendChild(this.modal);
    }

    /**
     * Update progress
     */
    update(current: number, message: string, filename?: string): void {
        this.tracker.update(current, message, filename);
    }

    /**
     * Complete the progress
     */
    complete(message: string = 'Complete!'): void {
        this.tracker.complete(message);
        this.notice = new Notice(message, 3000);
        setTimeout(() => this.close(), 1000);
    }

    /**
     * Show error
     */
    error(message: string): void {
        this.tracker.error(message);
        this.notice = new Notice(message, 5000);
        setTimeout(() => this.close(), 3000);
    }

    /**
     * Check if cancelled
     */
    isCancelled(): boolean {
        return this.tracker.isCancelled();
    }

    /**
     * Close the modal
     */
    close(): void {
        this.tracker.destroy();
        this.modal.remove();
    }
}
