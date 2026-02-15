import { ItemView, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { PerplexityPlugin } from '../PerplexityPlugin';
import { SpellCheckResult } from '../types';

export const SIDEBAR_VIEW_TYPE = 'perplexity-sidebar-view';

export class SidebarView extends ItemView {
    private plugin: PerplexityPlugin;
    private currentFile: TFile | null = null;
    private spellCheckResults: SpellCheckResult | null = null;
    private selectedCorrections: Set<number> = new Set();
    private appliedCorrections: Set<number> = new Set();
    private undoHistory: Array<{file: TFile, content: string}> = [];
    private isProcessing: boolean = false;

    constructor(leaf: WorkspaceLeaf, plugin: PerplexityPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
            this.updateActiveFile();
        }));
    }

    public getViewType(): string {
        return SIDEBAR_VIEW_TYPE;
    }

    public getDisplayText(): string {
        return 'Perplexity Assistant';
    }

    public getIcon(): string {
        return 'brain';
    }

    public async onOpen(): Promise<void> {
        this.updateActiveFile();
        await this.render();
    }

    public async onClose(): Promise<void> {
        this.cleanup();
    }

    private updateActiveFile(): void {
        this.currentFile = this.app.workspace.getActiveFile();
        this.refresh();
    }

    private cleanup(): void {
        this.currentFile = null;
        this.spellCheckResults = null;
        this.selectedCorrections.clear();
        this.appliedCorrections.clear();
        this.undoHistory = [];
    }

    private refresh(): void {
        if (this.containerEl) {
            this.render();
        }
    }

    public setSpellCheckResults(results: SpellCheckResult | null): void {
        this.spellCheckResults = results;
        this.selectedCorrections.clear();
        this.appliedCorrections.clear();
        this.refresh();
    }

    private async render(): Promise<void> {
        const container = this.containerEl;
        container.empty();
        container.addClass('perplexity-sidebar');

        // Check if RTL is enabled (Arabic language or RTL support setting)
        const isRTL = this.plugin.settings.spellCheckLanguage === 'ar' || this.plugin.settings.rtlSupport;

        // Keep main container as LTR for scrollbar on right side
        // RTL direction is applied only to the inner sidebar-container via CSS
        container.setAttr('dir', 'ltr');

        // Apply inline styles as fallback for max-width (Obsidian may override CSS)
        container.style.maxWidth = '500px';
        container.style.minWidth = '280px';
        container.style.margin = '0 auto';
        container.style.boxSizing = 'border-box';

        // Main container - set direction attribute, CSS handles the rest
        const mainContainer = container.createDiv({ 
            cls: 'sidebar-container'
        });
        mainContainer.setAttr('dir', isRTL ? 'rtl' : 'ltr');

        // Header section
        const header = mainContainer.createDiv({ cls: 'sidebar-header' });
        header.createDiv({ cls: 'sidebar-title', text: 'Perplexity Assistant' });

        if (!this.currentFile) {
            this.renderEmptyState(mainContainer);
            return;
        }

        // File info section
        this.renderFileInfo(mainContainer);

        // Spell check section
        this.renderSpellCheckSection(mainContainer);

        // Quick actions section
        this.renderQuickActions(mainContainer);
    }

    private renderEmptyState(container: HTMLElement): void {
        const emptyState = container.createDiv({ cls: 'empty-state' });
        emptyState.createDiv({ cls: 'empty-state-icon', text: '📝' });
        emptyState.createDiv({ cls: 'empty-state-title', text: 'No Active File' });
        emptyState.createDiv({ 
            cls: 'empty-state-text', 
            text: 'Open a markdown file to see spell check results and suggestions' 
        });
    }

    private renderFileInfo(container: HTMLElement): void {
        const fileInfo = container.createDiv({ cls: 'card file-info-card' });

        const fileName = fileInfo.createDiv({ cls: 'file-info-name' });
        fileName.createSpan({ cls: 'file-icon', text: '📄' });
        fileName.createSpan({ cls: 'file-name', text: this.currentFile!.basename });

        const stats = fileInfo.createDiv({ cls: 'file-info-stats' });

        if (this.spellCheckResults) {
            const totalCorrections = this.spellCheckResults.corrections.length;
            const totalIssues = this.spellCheckResults.formattingIssues.length;
            const appliedCount = this.appliedCorrections.size;

            stats.createSpan({ 
                cls: 'stat-badge ' + (totalCorrections > 0 ? 'has-corrections' : ''),
                text: `${totalCorrections - appliedCount} corrections` 
            });
            stats.createSpan({ 
                cls: 'stat-badge ' + (totalIssues > 0 ? 'has-issues' : ''),
                text: `${totalIssues} issues` 
            });
        }
    }

    private renderSpellCheckSection(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'card spell-check-card' });
        const header = section.createDiv({ cls: 'card-header' });
        header.createSpan({ cls: 'card-title', text: 'Spell Check Results' });

        if (!this.spellCheckResults || (this.spellCheckResults.corrections.length === 0 && this.spellCheckResults.formattingIssues.length === 0)) {
            this.renderNoCorrections(section);
            return;
        }

        const { corrections, formattingIssues } = this.spellCheckResults;
        const pendingCorrections = corrections.filter((_, idx) => !this.appliedCorrections.has(idx));

        if (pendingCorrections.length === 0 && formattingIssues.length === 0) {
            this.renderAllApplied(section);
            return;
        }

        // Action buttons (only show if there are corrections)
        if (pendingCorrections.length > 0) {
            const actions = section.createDiv({ cls: 'spell-check-actions' });

            const applyAllBtn = actions.createEl('button', { 
                cls: 'btn btn-primary btn-small',
                text: 'Apply All' 
            });
            applyAllBtn.addEventListener('click', () => this.applyAllCorrections());

            const applySelectedBtn = actions.createEl('button', { 
                cls: 'btn btn-secondary btn-small',
                text: 'Apply Selected' 
            });
            applySelectedBtn.addEventListener('click', () => this.applySelectedCorrections());

            const undoBtn = actions.createEl('button', { 
                cls: 'btn btn-ghost btn-small',
                text: '↩ Undo' 
            });
            undoBtn.addEventListener('click', () => this.undoLastAction());

            // Corrections list
            const correctionsList = section.createDiv({ cls: 'corrections-list' });

            corrections.forEach((correction, index) => {
                if (this.appliedCorrections.has(index)) {
                    return;
                }
                this.renderCorrectionItem(correctionsList, correction, index);
            });
        }

        // Formatting issues section
        if (formattingIssues && formattingIssues.length > 0) {
            this.renderFormattingIssues(section, formattingIssues);
        }
    }

    private renderNoCorrections(container: HTMLElement): void {
        const noCorrections = container.createDiv({ cls: 'no-corrections' });
        noCorrections.createSpan({ cls: 'no-corrections-icon', text: '✓' });
        noCorrections.createSpan({ 
            cls: 'no-corrections-text', 
            text: 'No corrections needed' 
        });
    }

    private renderAllApplied(container: HTMLElement): void {
        const allApplied = container.createDiv({ cls: 'all-applied' });
        allApplied.createSpan({ cls: 'all-applied-icon', text: '✓' });
        allApplied.createSpan({ 
            cls: 'all-applied-text', 
            text: 'All corrections applied' 
        });
    }

    private renderCorrectionItem(
        container: HTMLElement, 
        correction: any, 
        index: number
    ): void {
        const isSelected = this.selectedCorrections.has(index);
        const item = container.createDiv({ 
            cls: 'correction-item' + (isSelected ? ' selected' : '') 
        });

        // Check if RTL mode is enabled
        const isRTL = this.plugin.settings.spellCheckLanguage === 'ar' || this.plugin.settings.rtlSupport;

        // Main content wrapper (100% width) - contains left panel and content
        const mainContent = item.createDiv({ cls: 'correction-main-content' });

        // Left panel: checkbox above apply button
        const leftPanel = mainContent.createDiv({ cls: 'correction-left-panel' });

        // Checkbox
        const checkboxWrapper = leftPanel.createDiv({ cls: 'correction-checkbox' });
        const checkbox = checkboxWrapper.createEl('input', { 
            type: 'checkbox',
            cls: 'correction-checkbox-input'
        });
        checkbox.checked = isSelected;
        checkbox.addEventListener('change', (e) => {
            const checked = (e.target as HTMLInputElement).checked;
            if (checked) {
                this.selectedCorrections.add(index);
            } else {
                this.selectedCorrections.delete(index);
            }
            item.classList.toggle('selected', checked);
        });

        // Apply button (in left panel, below checkbox)
        const action = leftPanel.createDiv({ cls: 'correction-action' });
        const applyBtn = action.createEl('button', { 
            cls: 'btn btn-small btn-apply',
            text: 'Apply' 
        });
        applyBtn.addEventListener('click', () => this.applyCorrection(index));

        // Content (right side)
        const content = mainContent.createDiv({ cls: 'correction-content' });

        // Original text
        const originalSection = content.createDiv({ cls: 'correction-section original' });
        const originalLabel = originalSection.createDiv({ cls: 'correction-label', text: 'Original' });
        originalSection.createDiv({ 
            cls: 'correction-text original-text',
            text: correction.original 
        });

        // Suggested text
        const suggestedSection = content.createDiv({ cls: 'correction-section suggested' });
        const suggestedLabel = suggestedSection.createDiv({ cls: 'correction-label', text: 'Suggested' });
        suggestedSection.createDiv({ 
            cls: 'correction-text suggested-text',
            text: correction.suggested 
        });

        // Confidence indicator
        const confidence = content.createDiv({ cls: 'correction-confidence' });
        const confidenceLabel = confidence.createDiv({ cls: 'confidence-label', text: 'Confidence' });
        const confidenceBar = confidence.createDiv({ cls: 'confidence-bar-container' });
        
        // Determine confidence color based on score
        // API returns confidence as decimal (0-1), convert to percentage (0-100)
        let confidenceScore = correction.confidence || 0;
        
        // If confidence is a decimal (0-1), convert to percentage
        if (confidenceScore > 0 && confidenceScore <= 1) {
            confidenceScore = confidenceScore * 100;
        }
        
        let confidenceColor = 'var(--color-blue-500)';
        let confidenceColorEnd = 'var(--color-blue-600)';
        let confidenceValueColor = 'var(--color-blue-600)';
        
        if (confidenceScore >= 80) {
            confidenceColor = 'var(--color-success-500)';
            confidenceColorEnd = 'var(--color-success-600)';
            confidenceValueColor = 'var(--color-success-600)';
        } else if (confidenceScore >= 60) {
            confidenceColor = 'var(--color-warning-500)';
            confidenceColorEnd = 'var(--color-warning-600)';
            confidenceValueColor = 'var(--color-warning-600)';
        } else {
            confidenceColor = 'var(--color-error-500)';
            confidenceColorEnd = 'var(--color-error-600)';
            confidenceValueColor = 'var(--color-error-600)';
        }
        
        const confidenceFill = confidenceBar.createDiv({ 
            cls: 'confidence-bar-fill',
            attr: { style: `width: ${confidenceScore}%; background: linear-gradient(90deg, ${confidenceColor}, ${confidenceColorEnd});` }
        });
        const confidenceValue = confidence.createDiv({ 
            cls: 'confidence-value',
            attr: { style: `color: ${confidenceValueColor}` },
            text: `${Math.round(confidenceScore)}%`
        });

        // Context if available (100% width at bottom)
        if (correction.context) {
            const context = item.createDiv({ cls: 'correction-context' });
            context.createDiv({ cls: 'context-label', text: 'Context' });
            context.createDiv({ cls: 'context-text', text: correction.context });
        }
    }

    private renderFormattingIssues(container: HTMLElement, formattingIssues: any[]): void {
        const section = container.createDiv({ cls: 'formatting-issues-section' });
        const header = section.createDiv({ cls: 'formatting-issues-header' });
        header.createSpan({ cls: 'formatting-issues-title', text: '⚠️ Formatting Issues' });
        header.createSpan({ cls: 'formatting-issues-count', text: `${formattingIssues.length} found` });

        const issuesList = section.createDiv({ cls: 'formatting-issues-list' });

        formattingIssues.forEach((issue, index) => {
            this.renderFormattingIssueItem(issuesList, issue, index);
        });
    }

    private renderFormattingIssueItem(container: HTMLElement, issue: any, index: number): void {
        const item = container.createDiv({ cls: 'formatting-issue-item' });

        // Issue header with line number
        const issueHeader = item.createDiv({ cls: 'formatting-issue-header' });
        issueHeader.createSpan({ cls: 'formatting-issue-type', text: issue.type || 'Formatting' });
        if (issue.line) {
            issueHeader.createSpan({ cls: 'formatting-issue-line', text: `Line ${issue.line}` });
        }

        // Issue description
        const description = item.createDiv({ cls: 'formatting-issue-description' });
        description.createDiv({ cls: 'formatting-issue-label', text: 'Issue' });
        description.createDiv({ cls: 'formatting-issue-text', text: issue.description || issue.message || 'Formatting issue detected' });

        // Suggestion if available
        if (issue.suggestion) {
            const suggestion = item.createDiv({ cls: 'formatting-issue-suggestion' });
            suggestion.createDiv({ cls: 'formatting-issue-label', text: 'Suggestion' });
            suggestion.createDiv({ cls: 'formatting-issue-suggestion-text', text: issue.suggestion });
        }

        // Apply button if fixable
        if (issue.fixable && issue.line) {
            const action = item.createDiv({ cls: 'formatting-issue-action' });
            const applyBtn = action.createEl('button', { 
                cls: 'btn btn-small btn-warning',
                text: 'Fix' 
            });
            applyBtn.addEventListener('click', () => this.applyFormattingFix(index, issue));
        }
    }

    private async applyFormattingFix(index: number, issue: any): Promise<void> {
        if (!this.currentFile || this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        try {
            const content = await this.app.vault.read(this.currentFile);
            const lines = content.split('\n');

            if (issue.line > 0 && issue.line <= lines.length && issue.originalText && issue.suggestedText) {
                // Save for undo
                this.undoHistory.push({ file: this.currentFile, content });

                // Apply the fix - replace only the problematic text with the suggested text
                const lineContent = lines[issue.line - 1];
                const newLineContent = lineContent.replace(issue.originalText, issue.suggestedText);
                lines[issue.line - 1] = newLineContent;

                const newContent = lines.join('\n');
                await this.app.vault.modify(this.currentFile, newContent);

                // Remove the issue from the list
                if (this.spellCheckResults) {
                    this.spellCheckResults.formattingIssues.splice(index, 1);
                }

                this.refresh();
                new Notice('Formatting fix applied successfully');
            }
        } catch (error) {
            new Notice('Failed to apply formatting fix: ' + (error as Error).message);
        } finally {
            this.isProcessing = false;
        }
    }

    private renderQuickActions(container: HTMLElement): void {
        const section = container.createDiv({ cls: 'card quick-actions-card' });
        const header = section.createDiv({ cls: 'card-header' });
        header.createSpan({ cls: 'card-title', text: 'Quick Actions' });

        const actions = section.createDiv({ cls: 'quick-actions-grid' });

        const spellCheckBtn = actions.createEl('button', { 
            cls: 'action-btn spell-check-btn',
            text: '🔤 Spell Check' 
        });
        spellCheckBtn.addEventListener('click', () => this.runSpellCheck());

        const reanalyzeBtn = actions.createEl('button', { 
            cls: 'action-btn reanalyze-btn',
            text: '🔄 Reanalyze' 
        });
        reanalyzeBtn.addEventListener('click', () => this.runSpellCheck());

        const copyContentBtn = actions.createEl('button', { 
            cls: 'action-btn copy-btn',
            text: '📋 Copy Content' 
        });
        copyContentBtn.addEventListener('click', () => this.copyFileContent());

        const clearResultsBtn = actions.createEl('button', { 
            cls: 'action-btn clear-btn',
            text: '🗑️ Clear Results' 
        });
        clearResultsBtn.addEventListener('click', () => this.clearResults());
    }

    private async runSpellCheck(): Promise<void> {
        if (!this.currentFile || this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        this.showProcessingState();

        try {
            const content = await this.app.vault.read(this.currentFile);
            const service = (this.plugin as any).perplexityService;
            
            if (service) {
                const language = this.plugin.settings.spellCheckLanguage;
                const result = await service.checkSpellingAndFormat(content, language);
                this.setSpellCheckResults(result);
                new Notice('Spell check completed');
            }
        } catch (error) {
            new Notice('Spell check failed: ' + (error as Error).message);
        } finally {
            this.isProcessing = false;
            this.refresh();
        }
    }

    private showProcessingState(): void {
        const container = this.containerEl.querySelector('.sidebar-container');
        if (!container) return;

        const existingProcessing = container.querySelector('.processing-state');
        if (existingProcessing) {
            existingProcessing.remove();
        }

        const processing = container.createDiv({ cls: 'card processing-state' });
        processing.createDiv({ cls: 'processing-spinner' });
        processing.createDiv({ cls: 'processing-text', text: 'Processing...' });
    }

    private async applyCorrection(index: number): Promise<void> {
        if (!this.spellCheckResults || !this.currentFile || this.isProcessing) {
            return;
        }

        const correction = this.spellCheckResults.corrections[index];
        
        if (!correction || this.appliedCorrections.has(index)) {
            return;
        }

        this.isProcessing = true;

        try {
            const content = await this.app.vault.read(this.currentFile);

            // Save for undo
            this.undoHistory.push({ file: this.currentFile, content });

            // Replace all occurrences using global regex (like the old working code)
            const regex = new RegExp(correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const newContent = content.replace(regex, correction.suggested);
            await this.app.vault.modify(this.currentFile, newContent);

            this.appliedCorrections.add(index);
            this.selectedCorrections.delete(index);
            this.refresh();

            new Notice('Correction applied successfully');
        } catch (error) {
            new Notice('Failed to apply correction: ' + (error as Error).message);
        } finally {
            this.isProcessing = false;
        }
    }

    private async applyAllCorrections(): Promise<void> {
        if (!this.spellCheckResults || !this.currentFile || this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        this.showProcessingState();

        try {
            let content = await this.app.vault.read(this.currentFile);

            // Save for undo
            this.undoHistory.push({ file: this.currentFile, content });

            // Apply all corrections using global regex (like the old working code)
            for (let i = 0; i < this.spellCheckResults.corrections.length; i++) {
                const correction = this.spellCheckResults.corrections[i];
                
                if (this.appliedCorrections.has(i)) {
                    continue;
                }

                const regex = new RegExp(correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                content = content.replace(regex, correction.suggested);
                this.appliedCorrections.add(i);
            }

            await this.app.vault.modify(this.currentFile, content);
            this.refresh();
            new Notice('All corrections applied successfully');
        } catch (error) {
            new Notice('Failed to apply corrections: ' + (error as Error).message);
        } finally {
            this.isProcessing = false;
            this.refresh();
        }
    }

    private async applySelectedCorrections(): Promise<void> {
        if (!this.spellCheckResults || !this.currentFile || this.isProcessing) {
            return;
        }

        if (this.selectedCorrections.size === 0) {
            new Notice('No corrections selected');
            return;
        }

        this.isProcessing = true;
        this.showProcessingState();

        try {
            let content = await this.app.vault.read(this.currentFile);

            // Save for undo
            this.undoHistory.push({ file: this.currentFile, content });

            // Apply selected corrections using global regex (like the old working code)
            for (const index of this.selectedCorrections) {
                const correction = this.spellCheckResults.corrections[index];
                
                if (this.appliedCorrections.has(index)) {
                    continue;
                }

                const regex = new RegExp(correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                content = content.replace(regex, correction.suggested);
                this.appliedCorrections.add(index);
            }

            await this.app.vault.modify(this.currentFile, content);
            this.selectedCorrections.clear();
            this.refresh();
            new Notice('Selected corrections applied successfully');
        } catch (error) {
            new Notice('Failed to apply corrections: ' + (error as Error).message);
        } finally {
            this.isProcessing = false;
            this.refresh();
        }
    }

    private async undoLastAction(): Promise<void> {
        if (this.undoHistory.length === 0 || !this.currentFile) {
            new Notice('Nothing to undo');
            return;
        }

        const lastAction = this.undoHistory.pop();
        if (lastAction && lastAction.file === this.currentFile) {
            try {
                await this.app.vault.modify(this.currentFile, lastAction.content);
                this.appliedCorrections.clear();
                this.refresh();
                new Notice('Undo successful');
            } catch (error) {
                new Notice('Failed to undo: ' + (error as Error).message);
            }
        }
    }

    private async copyFileContent(): Promise<void> {
        if (!this.currentFile) {
            return;
        }

        try {
            const content = await this.app.vault.read(this.currentFile);
            await navigator.clipboard.writeText(content);
            new Notice('Content copied to clipboard');
        } catch (error) {
            new Notice('Failed to copy content: ' + (error as Error).message);
        }
    }

    private clearResults(): void {
        this.spellCheckResults = null;
        this.selectedCorrections.clear();
        this.appliedCorrections.clear();
        this.refresh();
        new Notice('Results cleared');
    }
}
