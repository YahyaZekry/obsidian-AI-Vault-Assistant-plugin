import { Modal, App } from 'obsidian';

export class HelpModal extends Modal {
    constructor(app: App, private spellCheckLanguage: string = 'en') {
        super(app);
        this.setTitle('📖 AI Vault Assistant - Help');
    }

    onOpen() {
        const contentEl = this.contentEl;

        // Add RTL support only for Arabic language
        if (this.spellCheckLanguage === 'ar') {
            contentEl.addClass('rtl-content');
        }

        contentEl.createEl('h2', { text: '📚 Documentation' });

        const sections = [
            {
                title: 'Getting Started',
                content: `
                    <h3>🚀 Getting Started</h3>
                    <p><strong>1. Setup API Key:</strong></p>
                    <ul>
                        <li>Get your API key from <a href="https://perplexity.ai">perplexity.ai</a></li>
                        <li>Go to Settings → Community Plugins → AI Vault Assistant</li>
                        <li>Enter your API key in settings</li>
                    </ul>
                    
                    <p><strong>2. Spell Check Modes:</strong></p>
                    <ul>
                        <li><strong>Full Mode:</strong> Checks entire document with chunked processing. Best for final drafts.</li>
                        <li><strong>Incremental Mode:</strong> Check section-by-section to control costs. Great for drafts.</li>
                        <li><strong>Auto Mode:</strong> Smart balance. Analyzes first section, auto-suggests full check if needed.</li>
                    </ul>
                    
                    <p><strong>3. Vault Analysis:</strong></p>
                    <p>Use the ribbon icon or command palette to analyze your entire vault. Detects themes and content patterns across all markdown files.</p>
                `
            },
            {
                title: 'Smart Linking',
                content: `
                    <h3>🔗 Smart Linking</h3>
                    <p>AI-powered link suggestions based on semantic analysis of your notes:</p>
                    <ul>
                        <li><strong>Conceptual:</strong> Files sharing similar ideas or topics</li>
                        <li><strong>Sequential:</strong> Files that follow a logical progression</li>
                        <li><strong>Complementary:</strong> Files with supporting information</li>
                        <li><strong>Reference:</strong> Files that cite or reference each other</li>
                    </ul>
                    <p>Each suggestion includes a relevance score, reasoning, and common themes.</p>
                `
            },
            {
                title: 'Settings Guide',
                content: `
                    <h3>⚙️ Settings Guide</h3>
                    <p><strong>Spell Check Mode:</strong> Choose between Full, Incremental, or Auto modes for spell checking.</p>
                    <p><strong>Chunk Size:</strong> Control how many characters per API call (Full mode).</p>
                    <p><strong>Error Threshold:</strong> Auto mode triggers full check when error density exceeds this threshold.</p>
                    <p><strong>RTL Support:</strong> Enable for Arabic and other right-to-left languages.</p>
                    <p><strong>Caching:</strong> Enable to reduce API calls and costs.</p>
                    <p><strong>File Filtering:</strong> Exclude certain file types from analysis (PDFs, images, etc.).</p>
                `
            },
            {
                title: 'Troubleshooting',
                content: `
                    <h3>🔧 Troubleshooting</h3>
                    <p><strong>API key not configured:</strong></p>
                    <p>Go to Settings → Community Plugins → AI Vault Assistant and enter your API key.</p>
                    
                    <p><strong>Rate limit exceeded:</strong></p>
                    <p>Wait 60 seconds before trying again. Consider using caching to reduce API calls.</p>
                    
                    <p><strong>Spell check not working:</strong></p>
                    <p>Check your spell check mode setting. Try switching from Incremental to Full mode.</p>
                    
                    <p><strong>File conflicts:</strong></p>
                    <p>If a file was modified externally, the plugin will show a conflict dialog. You can choose to merge or overwrite.</p>
                `
            }
        ];

        sections.forEach((section, index) => {
            const sectionDiv = contentEl.createDiv({ cls: 'help-section' });
            sectionDiv.createEl('h3', { text: `${index + 1}. ${section.title}` });
            sectionDiv.innerHTML += section.content;
        });
    }

    onClose() {
        this.contentEl.empty();
    }
}
