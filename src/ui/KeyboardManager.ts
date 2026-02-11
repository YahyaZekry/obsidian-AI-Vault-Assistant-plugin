import { Plugin } from 'obsidian';

export interface KeyboardShortcut {
    key: string;
    modifiers: string[];
    description: string;
    action: () => void;
}

export class KeyboardManager {
    private plugin: Plugin;
    private shortcuts: Map<string, KeyboardShortcut> = new Map();
    private enabled: boolean = true;
    private keydownHandler: (event: KeyboardEvent) => void;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.keydownHandler = this.handleKeydown.bind(this);
        document.addEventListener('keydown', this.keydownHandler);
    }

    /**
     * Register a keyboard shortcut
     */
    registerShortcut(shortcut: KeyboardShortcut): void {
        const key = this.formatShortcutKey(shortcut.key, shortcut.modifiers);
        this.shortcuts.set(key, shortcut);
    }

    /**
     * Unregister a keyboard shortcut
     */
    unregisterShortcut(key: string, modifiers: string[]): void {
        const formattedKey = this.formatShortcutKey(key, modifiers);
        this.shortcuts.delete(formattedKey);
    }

    /**
     * Format shortcut key for storage
     */
    private formatShortcutKey(key: string, modifiers: string[]): string {
        return [...modifiers, key].join('+');
    }

    /**
     * Handle keyboard event
     */
    private handleKeydown(event: KeyboardEvent): void {
        if (!this.enabled) return;

        const modifiers: string[] = [];
        if (event.ctrlKey || event.metaKey) modifiers.push('Mod');
        if (event.shiftKey) modifiers.push('Shift');
        if (event.altKey) modifiers.push('Alt');

        const key = this.formatShortcutKey(event.key, modifiers);
        const shortcut = this.shortcuts.get(key);

        if (shortcut) {
            event.preventDefault();
            shortcut.action();
        }
    }

    /**
     * Enable keyboard shortcuts
     */
    enable(): void {
        this.enabled = true;
    }

    /**
     * Disable keyboard shortcuts
     */
    disable(): void {
        this.enabled = false;
    }

    /**
     * Check if keyboard shortcuts are enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Get all registered shortcuts
     */
    getShortcuts(): KeyboardShortcut[] {
        return Array.from(this.shortcuts.values());
    }

    /**
     * Get shortcut by key
     */
    getShortcut(key: string, modifiers: string[]): KeyboardShortcut | undefined {
        const formattedKey = this.formatShortcutKey(key, modifiers);
        return this.shortcuts.get(formattedKey);
    }

    /**
     * Clear all shortcuts
     */
    clearShortcuts(): void {
        this.shortcuts.clear();
    }

    /**
     * Format shortcut for display
     */
    formatShortcutForDisplay(shortcut: KeyboardShortcut): string {
        const parts: string[] = [];
        
        if (shortcut.modifiers.includes('Mod')) {
            parts.push('Ctrl/Cmd');
        }
        if (shortcut.modifiers.includes('Shift')) {
            parts.push('Shift');
        }
        if (shortcut.modifiers.includes('Alt')) {
            parts.push('Alt');
        }
        
        parts.push(shortcut.key.toUpperCase());
        return parts.join(' + ');
    }

    /**
     * Generate HTML for keyboard shortcuts help
     */
    generateShortcutsHelp(): string {
        const shortcuts = this.getShortcuts();
        let html = '<div class="keyboard-shortcuts-section">';
        html += '<h3>⌨️ Keyboard Shortcuts</h3>';
        
        shortcuts.forEach(shortcut => {
            html += '<div class="keyboard-shortcut-item">';
            html += `<span class="keyboard-shortcut-key">${this.formatShortcutForDisplay(shortcut)}</span>`;
            html += `<span class="keyboard-shortcut-description">${shortcut.description}</span>`;
            html += '</div>';
        });
        
        html += '</div>';
        return html;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        document.removeEventListener('keydown', this.keydownHandler);
        this.shortcuts.clear();
        this.enabled = false;
    }
}
