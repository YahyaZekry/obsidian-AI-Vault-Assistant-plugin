export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
    duration?: number;
    dismissible?: boolean;
    icon?: string;
}

export class ToastManager {
    private static instance: ToastManager;
    private container: HTMLElement | null = null;
    private toasts: Map<string, HTMLElement> = new Map();
    private toastCounter: number = 0;
    private defaultDuration: number = 5000;
    private maxToasts: number = 5;

    private constructor() {
        this.createContainer();
    }

    static getInstance(): ToastManager {
        if (!ToastManager.instance) {
            ToastManager.instance = new ToastManager();
        }
        return ToastManager.instance;
    }

    /**
     * Create toast container
     */
    private createContainer(): void {
        this.container = document.createElement('div');
        this.container.addClass('ai-vault-toast-container');
        document.body.appendChild(this.container);
    }

    /**
     * Show a toast notification
     */
    show(message: string, type: ToastType = 'info', options: ToastOptions = {}): void {
        const duration = options.duration ?? this.defaultDuration;
        const dismissible = options.dismissible ?? true;
        const icon = options.icon ?? this.getDefaultIcon(type);

        // Remove oldest toast if max reached
        if (this.toasts.size >= this.maxToasts) {
            const oldestKey = this.toasts.keys().next().value;
            if (oldestKey) {
                this.dismiss(oldestKey);
            }
        }

        // Create toast element
        const toastId = `toast-${this.toastCounter++}`;
        const toast = this.createToastElement(message, type, icon, dismissible, toastId);

        // Add to container
        this.container?.appendChild(toast);
        this.toasts.set(toastId, toast);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toastId);
            }, duration);
        }
    }

    /**
     * Create toast element
     */
    private createToastElement(
        message: string,
        type: ToastType,
        icon: string,
        dismissible: boolean,
        toastId: string
    ): HTMLElement {
        const toast = document.createElement('div');
        toast.addClass('ai-vault-toast');
        toast.addClass(`ai-vault-toast-${type}`);
        toast.dataset.toastId = toastId;

        // Icon
        const iconEl = document.createElement('span');
        iconEl.addClass('ai-vault-toast-icon');
        iconEl.textContent = icon;
        toast.appendChild(iconEl);

        // Message
        const messageEl = document.createElement('span');
        messageEl.addClass('ai-vault-toast-message');
        messageEl.textContent = message;
        toast.appendChild(messageEl);

        // Dismiss button
        if (dismissible) {
            const dismissBtn = document.createElement('button');
            dismissBtn.addClass('ai-vault-toast-dismiss');
            dismissBtn.innerHTML = '&times;';
            dismissBtn.setAttribute('aria-label', 'Dismiss notification');
            dismissBtn.addEventListener('click', () => {
                this.dismiss(toastId);
            });
            toast.appendChild(dismissBtn);
        }

        return toast;
    }

    /**
     * Get default icon for toast type
     */
    private getDefaultIcon(type: ToastType): string {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
            default:
                return 'ℹ️';
        }
    }

    /**
     * Dismiss a toast by ID
     */
    dismiss(toastId: string): void {
        const toast = this.toasts.get(toastId);
        if (toast) {
            toast.addClass('removing');
            setTimeout(() => {
                toast.remove();
                this.toasts.delete(toastId);
            }, 300); // Wait for animation to complete
        }
    }

    /**
     * Dismiss all toasts
     */
    dismissAll(): void {
        const toastIds = Array.from(this.toasts.keys());
        toastIds.forEach(id => this.dismiss(id));
    }

    /**
     * Show success toast
     */
    success(message: string, options?: ToastOptions): void {
        this.show(message, 'success', options);
    }

    /**
     * Show error toast
     */
    error(message: string, options?: ToastOptions): void {
        this.show(message, 'error', options);
    }

    /**
     * Show warning toast
     */
    warning(message: string, options?: ToastOptions): void {
        this.show(message, 'warning', options);
    }

    /**
     * Show info toast
     */
    info(message: string, options?: ToastOptions): void {
        this.show(message, 'info', options);
    }

    /**
     * Set default duration for toasts
     */
    setDefaultDuration(duration: number): void {
        this.defaultDuration = duration;
    }

    /**
     * Get default duration
     */
    getDefaultDuration(): number {
        return this.defaultDuration;
    }

    /**
     * Set maximum number of toasts to show
     */
    setMaxToasts(max: number): void {
        this.maxToasts = max;
    }

    /**
     * Get maximum number of toasts
     */
    getMaxToasts(): number {
        return this.maxToasts;
    }

    /**
     * Get number of active toasts
     */
    getActiveToastCount(): number {
        return this.toasts.size;
    }

    /**
     * Check if there are any active toasts
     */
    hasActiveToasts(): boolean {
        return this.toasts.size > 0;
    }

    /**
     * Clear all toasts immediately (without animation)
     */
    clear(): void {
        this.toasts.forEach(toast => toast.remove());
        this.toasts.clear();
    }

    /**
     * Destroy toast manager
     */
    destroy(): void {
        this.clear();
        this.container?.remove();
        this.container = null;
    }
}

// Export singleton instance
export const toastManager = ToastManager.getInstance();
