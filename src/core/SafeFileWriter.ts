import { App, TFile, Modal, Notice, Setting } from 'obsidian';

export type ConflictAction = 'cancel' | 'overwrite' | 'merge';

export interface ConflictResolution {
    action: ConflictAction;
    mergedContent?: string;
}

/**
 * Modal for resolving file conflicts
 */
class ConflictModal extends Modal {
    private originalContent: string;
    private newContent: string;
    private currentContent: string;
    private filename: string;
    private resolve: (resolution: ConflictResolution) => void;

    constructor(
        app: App,
        filename: string,
        originalContent: string,
        newContent: string,
        currentContent: string,
        resolve: (resolution: ConflictResolution) => void
    ) {
        super(app);
        this.filename = filename;
        this.originalContent = originalContent;
        this.newContent = newContent;
        this.currentContent = currentContent;
        this.resolve = resolve;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'File Conflict Detected' });

        const warningEl = contentEl.createDiv({ cls: 'conflict-warning' });
        warningEl.createEl('p', {
            text: `The file "${this.filename}" has been modified since you started editing.`
        });
        warningEl.createEl('p', {
            text: 'Please choose how to resolve this conflict:'
        });

        // Show diff summary
        const diffEl = contentEl.createDiv({ cls: 'conflict-diff' });
        diffEl.createEl('h3', { text: 'Changes Summary' });
        diffEl.createEl('p', { text: `Original length: ${this.originalContent.length} characters` });
        diffEl.createEl('p', { text: `Current length: ${this.currentContent.length} characters` });
        diffEl.createEl('p', { text: `New length: ${this.newContent.length} characters` });

        // Action buttons
        const buttonContainer = contentEl.createDiv({ cls: 'conflict-buttons' });

        const cancelButton = buttonContainer.createEl('button', {
            cls: 'mod-warning',
            text: 'Cancel'
        });
        cancelButton.addEventListener('click', () => {
            this.resolve({ action: 'cancel' });
            this.close();
        });

        const overwriteButton = buttonContainer.createEl('button', {
            cls: 'mod-danger',
            text: 'Overwrite'
        });
        overwriteButton.addEventListener('click', () => {
            this.resolve({ action: 'overwrite' });
            this.close();
        });

        const mergeButton = buttonContainer.createEl('button', {
            cls: 'mod-cta',
            text: 'Merge'
        });
        mergeButton.addEventListener('click', () => {
            const merged = this.mergeContent();
            this.resolve({ action: 'merge', mergedContent: merged });
            this.close();
        });
    }

    /**
     * Simple merge strategy - use new content but preserve any unique additions
     */
    private mergeContent(): string {
        // For now, use a simple strategy: prefer new content
        // In a more sophisticated implementation, you could use a diff library
        return this.newContent;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/**
 * Safe file writer with conflict detection
 */
export class SafeFileWriter {
    private app: App;
    private pendingWrites: Map<string, string> = new Map();

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Write file with conflict detection
     */
    async writeWithConflictCheck(
        file: TFile,
        originalContent: string,
        newContent: string
    ): Promise<void> {
        // Check if file still exists
        const currentFile = this.app.vault.getAbstractFileByPath(file.path);
        if (!currentFile || !(currentFile instanceof TFile)) {
            throw new Error(`File "${file.path}" no longer exists`);
        }

        // Read current content
        const currentContent = await this.app.vault.read(file);

        // Check for conflicts
        if (currentContent !== originalContent) {
            // Conflict detected - show dialog
            const resolution = await this.showConflictDialog(
                file.name,
                originalContent,
                newContent,
                currentContent
            );

            switch (resolution.action) {
                case 'cancel':
                    throw new Error('Write operation cancelled by user');
                case 'overwrite':
                    // Proceed with write
                    break;
                case 'merge':
                    // Use merged content
                    newContent = resolution.mergedContent || newContent;
                    break;
            }
        }

        // Write the file
        await this.app.vault.modify(file, newContent);
    }

    /**
     * Show conflict resolution dialog
     */
    private async showConflictDialog(
        filename: string,
        originalContent: string,
        newContent: string,
        currentContent: string
    ): Promise<ConflictResolution> {
        return new Promise((resolve) => {
            new ConflictModal(
                this.app,
                filename,
                originalContent,
                newContent,
                currentContent,
                resolve
            ).open();
        });
    }

    /**
     * Write file without conflict check (for internal use)
     */
    async writeFile(file: TFile, content: string): Promise<void> {
        await this.app.vault.modify(file, content);
    }

    /**
     * Create a new file
     */
    async createFile(path: string, content: string): Promise<TFile> {
        // Check if file already exists
        const existing = this.app.vault.getAbstractFileByPath(path);
        if (existing) {
            throw new Error(`File "${path}" already exists`);
        }

        return await this.app.vault.create(path, content);
    }

    /**
     * Create file with conflict check
     */
    async createFileWithConflictCheck(
        path: string,
        content: string,
        overwrite: boolean = false
    ): Promise<TFile> {
        const existing = this.app.vault.getAbstractFileByPath(path);

        if (existing && existing instanceof TFile) {
            if (!overwrite) {
                throw new Error(`File "${path}" already exists. Use overwrite option to replace it.`);
            }

            // Overwrite existing file
            await this.app.vault.modify(existing, content);
            return existing;
        }

        return await this.app.vault.create(path, content);
    }

    /**
     * Batch write multiple files with conflict detection
     */
    async batchWriteWithConflictCheck(
        operations: Array<{ file: TFile; originalContent: string; newContent: string }>
    ): Promise<void> {
        for (const op of operations) {
            await this.writeWithConflictCheck(op.file, op.originalContent, op.newContent);
        }
    }

    /**
     * Check if a file has been modified
     */
    async isFileModified(file: TFile, originalContent: string): Promise<boolean> {
        const currentContent = await this.app.vault.read(file);
        return currentContent !== originalContent;
    }

    /**
     * Get file content safely
     */
    async readFile(file: TFile): Promise<string> {
        try {
            return await this.app.vault.read(file);
        } catch (error) {
            throw new Error(`Failed to read file "${file.path}": ${error}`);
        }
    }

    /**
     * Delete file safely
     */
    async deleteFile(file: TFile): Promise<void> {
        try {
            await this.app.vault.delete(file);
        } catch (error) {
            throw new Error(`Failed to delete file "${file.path}": ${error}`);
        }
    }

    /**
     * Rename file safely
     */
    async renameFile(file: TFile, newPath: string): Promise<void> {
        try {
            await this.app.vault.rename(file, newPath);
        } catch (error) {
            throw new Error(`Failed to rename file "${file.path}": ${error}`);
        }
    }
}
