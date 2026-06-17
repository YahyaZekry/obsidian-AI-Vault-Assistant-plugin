import { Modal, App, Notice, TFile, MarkdownView, Editor, EditorPosition } from 'obsidian';
import { AIVaultAssistantPlugin } from '../../AIVaultAssistantPlugin';

interface SpellCheckResult {
    corrections: Array<{
        original: string;
        suggested: string;
        line: number;
        confidence: number;
        context?: string;
    }>;
    formattingIssues: Array<{
        issue: string;
        line: number;
        suggestion: string;
        fixable: boolean;
        originalText?: string;
        suggestedText?: string;
    }>;
}

export class SpellCheckResultsModal extends Modal {
    constructor(app: App, private file: TFile, private result: SpellCheckResult, private plugin: AIVaultAssistantPlugin) {
        super(app);
        this.setTitle(`Check Results - ${this.file.basename}`);
    }

    onOpen() {
        const contentEl = this.contentEl;
        const isRTL = this.plugin.settings.rtlSupport || this.plugin.settings.spellCheckLanguage === 'ar';

        // Apply RTL direction to the modal container
        if (isRTL) {
            contentEl.setAttr('dir', 'rtl');
        }

        if (this.result.corrections?.length > 0) {
            contentEl.createEl('h3', { text: `📝 Spelling Corrections (${this.result.corrections.length})` });

            this.result.corrections.forEach((correction: any, i) => {
                const div = contentEl.createDiv({ cls: 'spell-check-item' });

                div.createEl('h4', { text: `Correction ${i + 1}` });
                const correctionText = div.createEl('p');
                correctionText.textContent = `"${correction.original}" → "${correction.suggested}"`;
                if (isRTL) {
                    correctionText.addClass('rtl-text');
                }
                
                const lineText = div.createEl('p');
                lineText.textContent = `Line ${correction.line} (${Math.round(correction.confidence * 100)}% confidence)`;
                if (isRTL) {
                    lineText.addClass('rtl-text');
                }

                const context = correction.context || 'No context available';
                const contextDiv = div.createDiv({ cls: 'error-context' });
                if (isRTL) {
                    contextDiv.addClass('rtl-content');
                }
                contextDiv.createEl('strong', { text: '📄 Context:' });
                const contextText = contextDiv.createEl('p', { cls: 'context-text' });
                
                try {
                    const escapedContext = context
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                    const highlightedContext = escapedContext.replace(
                        new RegExp(`(${correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                        '<mark class="error-highlight">$1</mark>'
                    );
                    contextText.innerHTML = highlightedContext;
                    
                    const markElement = contextText.querySelector('.error-highlight');
                    if (markElement) {
                        (markElement as any).style.cursor = 'pointer';
                        (markElement as any).style.textDecoration = 'underline';
                        (markElement as any).addEventListener('click', () => this.scrollToLine(correction.line, correction.original));
                    }
                } catch (error) {
                    contextText.textContent = context;
                }

            const applyBtn = div.createEl('button', { text: '✓ Apply This' });
                    applyBtn.onclick = () => this.applySingle(correction.original, correction.suggested, correction.line, div);
            });

            const applyAllBtn = contentEl.createEl('button', { 
                text: '✅ Apply All Spelling Corrections',
                cls: 'apply-all-btn'
            });
            applyAllBtn.onclick = () => this.applyAllCorrections();
        }

        if (this.result.formattingIssues?.length > 0) {
            contentEl.createEl('h3', { text: `🔧 Formatting Issues (${this.result.formattingIssues.length})` });

            this.result.formattingIssues.forEach((issue: any, i) => {
                const div = contentEl.createDiv({ cls: 'formatting-item' });

                div.createEl('h4', { text: `Issue ${i + 1}` });
                
                const issueText = div.createEl('p');
                issueText.textContent = `Line ${issue.line}: ${issue.issue}`;
                if (isRTL) {
                    issueText.addClass('rtl-text');
                }
                
                const fixText = div.createEl('p');
                fixText.textContent = `Fix: ${issue.suggestion}`;
                if (isRTL) {
                    fixText.addClass('rtl-text');
                }

                if (issue.originalText && issue.suggestedText) {
                    const contextDiv = div.createDiv({ cls: 'error-context' });
                    if (isRTL) {
                        contextDiv.addClass('rtl-content');
                    }
                    contextDiv.createEl('strong', { text: '📄 Context:' });
                    const contextText = contextDiv.createEl('p', { cls: 'context-text' });
                    
                    try {
                        const escapedContext = issue.originalText
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;');
                        const highlightedContext = escapedContext.replace(
                            new RegExp(`(${issue.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                            '<mark class="error-highlight">$1</mark>'
                        );
                        contextText.innerHTML = highlightedContext;
                        
                        const markElement = contextText.querySelector('.error-highlight');
                        if (markElement) {
                            (markElement as any).style.cursor = 'pointer';
                            (markElement as any).style.textDecoration = 'underline';
                            (markElement as any).addEventListener('click', () => this.scrollToLine(issue.line, issue.originalText));
                        }
                    } catch (error) {
                        contextText.textContent = issue.originalText;
                    }
                }

                if (issue.fixable && issue.originalText && issue.suggestedText) {
                    const fixBtn = div.createEl('button', { text: '🔧 Fix This' });
                    fixBtn.onclick = () => this.applySingle(issue.originalText, issue.suggestedText, issue.line, div);
                }
            });

            const fixableIssues = this.result.formattingIssues.filter((i: any) => i.fixable);
            if (fixableIssues.length > 0) {
                const fixAllBtn = contentEl.createEl('button', { 
                    text: `🔧 Fix All ${fixableIssues.length} Formatting Issues`,
                    cls: 'fix-all-btn'
                });
                fixAllBtn.onclick = () => this.applyAllFixes();
            }
        }

        if (this.result.corrections.length === 0 && this.result.formattingIssues.length === 0) {
            contentEl.createEl('p', { text: '✅ No issues found! Your document looks perfect.' });
        }
    }

    private async applySingle(original: string, suggested: string, lineNumber: number, div: HTMLElement) {
        try {
            const content = await this.app.vault.read(this.file);
            const lines = content.split('\n');
            const lineIndex = lineNumber - 1;
            if (lineIndex >= 0 && lineIndex < lines.length) {
                const regex = new RegExp(
                    original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ''
                );
                lines[lineIndex] = lines[lineIndex].replace(regex, suggested);
                await this.plugin.fileWriter.writeWithConflictCheck(this.file, content, lines.join('\n'));
            }

            div.style.opacity = '0.5';
            new Notice(`✅ Applied: ${original.substring(0, 30)}...`);
        } catch (error) {
            console.error('Apply single correction error:', error);
            new Notice(`❌ Failed: ${error.message}`);
        }
    }

    private async applyAllCorrections() {
        const notice = new Notice('⏳ Applying all corrections...', 0);
        try {
            const content = await this.app.vault.read(this.file);
            const lines = content.split('\n');
            this.result.corrections.forEach((correction: any) => {
                const lineIndex = correction.line - 1;
                if (lineIndex >= 0 && lineIndex < lines.length) {
                    const regex = new RegExp(
                        correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ''
                    );
                    lines[lineIndex] = lines[lineIndex].replace(regex, correction.suggested);
                }
            });
            await this.plugin.fileWriter.writeWithConflictCheck(this.file, content, lines.join('\n'));
            notice.hide();
            new Notice(`✅ Applied ${this.result.corrections.length} corrections!`);
            this.close();
        } catch (error) {
            console.error('Apply all corrections error:', error);
            notice.hide();
            new Notice(`❌ Failed: ${error.message}`);
        }
    }

    private async applyAllFixes() {
        const fixableIssues = this.result.formattingIssues.filter((i: any) => i.fixable);
        const notice = new Notice(`⏳ Applying ${fixableIssues.length} fixes...`, 0);
        try {
            const content = await this.app.vault.read(this.file);
            const lines = content.split('\n');
            fixableIssues.forEach((issue: any) => {
                if (issue.originalText && issue.suggestedText) {
                    const lineIndex = issue.line - 1;
                    if (lineIndex >= 0 && lineIndex < lines.length) {
                        const regex = new RegExp(
                            issue.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ''
                        );
                        lines[lineIndex] = lines[lineIndex].replace(regex, issue.suggestedText);
                    }
                }
            });
            await this.plugin.fileWriter.writeWithConflictCheck(this.file, content, lines.join('\n'));
            notice.hide();
            new Notice(`✅ Applied ${fixableIssues.length} formatting fixes!`);
            this.close();
        } catch (error) {
            console.error('Apply all fixes error:', error);
            notice.hide();
            new Notice(`❌ Failed: ${error.message}`);
        }
    }

    private scrollToLine(lineNumber: number, highlightText?: string) {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            new Notice('Please open the file in editor mode');
            return;
        }

        const editor = activeView.editor;
        const lineCount = editor.lineCount();

        if (lineNumber > 0 && lineNumber <= lineCount) {
            // Set cursor to the line
            editor.setCursor({ line: lineNumber - 1, ch: 0 });
            
            // Scroll the line into view
            editor.scrollIntoView({
                from: { line: lineNumber - 1, ch: 0 },
                to: { line: lineNumber - 1, ch: 0 }
            });

            // Highlight text if provided
            if (highlightText) {
                this.highlightTextInEditor(editor, lineNumber, highlightText);
            }
        }
    }

    /**
     * Highlight specific text in the editor temporarily
     */
    private highlightTextInEditor(editor: Editor, lineNumber: number, text: string): void {
        const lineContent = editor.getLine(lineNumber - 1);
        
        // Find the text position in the line
        const textIndex = lineContent.indexOf(text);
        if (textIndex === -1) {
            // Try case-insensitive search
            const lowerLine = lineContent.toLowerCase();
            const lowerText = text.toLowerCase();
            const index = lowerLine.indexOf(lowerText);
            if (index !== -1) {
                const actualText = lineContent.substring(index, index + text.length);
                this.setSelectionAndHighlight(editor, lineNumber - 1, index, actualText);
            }
            return;
        }

        this.setSelectionAndHighlight(editor, lineNumber - 1, textIndex, text);
    }

    /**
     * Set selection and create temporary highlight effect
     */
    private setSelectionAndHighlight(editor: Editor, line: number, ch: number, text: string): void {
        const from: EditorPosition = { line, ch };
        const to: EditorPosition = { line, ch: ch + text.length };
        
        // Set selection to highlight the text
        editor.setSelection(from, to);

        // Add a visual highlight decoration via CSS class on the editor
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editorEl = (activeView as any).editorEl as HTMLElement;
            if (editorEl) {
                editorEl.addClass('ai-vault-highlight-active');
                
                // Remove highlight after 3 seconds
                setTimeout(() => {
                    editorEl.removeClass('ai-vault-highlight-active');
                    // Clear selection
                    const cursor = editor.getCursor();
                    editor.setSelection(cursor, cursor);
                }, 3000);
            }
        }
    }

    onClose() {
        this.contentEl.empty();
    }
}
