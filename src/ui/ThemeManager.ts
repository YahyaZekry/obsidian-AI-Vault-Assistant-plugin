export type ThemeMode = 'auto' | 'dark' | 'light';

export class ThemeManager {
    private static instance: ThemeManager;
    private currentMode: ThemeMode = 'auto';
    private isDark: boolean = false;

    private constructor() {
        this.detectTheme();
        this.setupThemeListener();
    }

    static getInstance(): ThemeManager {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }

    /**
     * Detect current theme from system or Obsidian
     */
    private detectTheme(): void {
        const body = document.body;
        this.isDark = body.classList.contains('theme-dark');
    }

    /**
     * Setup listener for theme changes
     */
    private setupThemeListener(): void {
        // Use MutationObserver to detect theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    this.detectTheme();
                    this.applyTheme();
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    /**
     * Set theme mode
     */
    setThemeMode(mode: ThemeMode): void {
        this.currentMode = mode;
        this.applyTheme();
    }

    /**
     * Get current theme mode
     */
    getThemeMode(): ThemeMode {
        return this.currentMode;
    }

    /**
     * Apply theme based on mode
     */
    private applyTheme(): void {
        const body = document.body;
        
        switch (this.currentMode) {
            case 'dark':
                this.isDark = true;
                break;
            case 'light':
                this.isDark = false;
                break;
            case 'auto':
            default:
                this.detectTheme();
                break;
        }

        // Update CSS variables if needed
        this.updateThemeVariables();
    }

    /**
     * Update CSS variables for theme
     */
    private updateThemeVariables(): void {
        const root = document.documentElement;
        
        if (this.isDark) {
            root.style.setProperty('--ai-vault-bg-primary', 'var(--background-primary)');
            root.style.setProperty('--ai-vault-bg-secondary', 'var(--background-secondary)');
            root.style.setProperty('--ai-vault-text-primary', 'var(--text-normal)');
            root.style.setProperty('--ai-vault-text-secondary', 'var(--text-muted)');
            root.style.setProperty('--ai-vault-border', '#374151');
            root.style.setProperty('--ai-vault-shadow', '0 4px 6px -1px rgb(0 0 0 / 0.3)');
        } else {
            root.style.setProperty('--ai-vault-bg-primary', 'var(--background-primary)');
            root.style.setProperty('--ai-vault-bg-secondary', 'var(--background-secondary)');
            root.style.setProperty('--ai-vault-text-primary', 'var(--text-normal)');
            root.style.setProperty('--ai-vault-text-secondary', 'var(--text-muted)');
            root.style.setProperty('--ai-vault-border', '#e5e7eb');
            root.style.setProperty('--ai-vault-shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1)');
        }
    }

    /**
     * Check if current theme is dark
     */
    isDarkMode(): boolean {
        return this.isDark;
    }

    /**
     * Check if current theme is light
     */
    isLightMode(): boolean {
        return !this.isDark;
    }

    /**
     * Toggle between dark and light mode
     */
    toggleTheme(): void {
        if (this.currentMode === 'auto') {
            // If in auto mode, toggle based on current detected theme
            this.setThemeMode(this.isDark ? 'light' : 'dark');
        } else {
            // Toggle between dark and light
            this.setThemeMode(this.isDark ? 'light' : 'dark');
        }
    }

    /**
     * Get theme info for display
     */
    getThemeInfo(): { mode: ThemeMode; isDark: boolean; label: string } {
        let label: string;
        
        switch (this.currentMode) {
            case 'dark':
                label = 'Dark';
                break;
            case 'light':
                label = 'Light';
                break;
            case 'auto':
            default:
                label = this.isDark ? 'Auto (Dark)' : 'Auto (Light)';
                break;
        }

        return {
            mode: this.currentMode,
            isDark: this.isDark,
            label
        };
    }

    /**
     * Get available theme modes
     */
    getAvailableModes(): Array<{ value: ThemeMode; label: string }> {
        return [
            { value: 'auto', label: 'Auto (System)' },
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' }
        ];
    }

    /**
     * Apply theme to a specific element
     */
    applyThemeToElement(element: HTMLElement): void {
        if (this.isDark) {
            element.addClass('theme-dark');
            element.removeClass('theme-light');
        } else {
            element.addClass('theme-light');
            element.removeClass('theme-dark');
        }
    }

    /**
     * Get appropriate color for theme
     */
    getColor(type: 'primary' | 'success' | 'error' | 'warning' | 'border' | 'shadow'): string {
        const colors: Record<string, Record<string, string>> = {
            dark: {
                primary: '#6366f1',
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                border: '#374151',
                shadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)'
            },
            light: {
                primary: '#6366f1',
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                border: '#e5e7eb',
                shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }
        };

        return colors[this.isDark ? 'dark' : 'light'][type];
    }

    /**
     * Cleanup
     */
    destroy(): void {
        // Remove any listeners if needed
    }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();
