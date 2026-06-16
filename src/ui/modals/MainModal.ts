import { Modal, App, Setting } from 'obsidian';
import { AIVaultAssistantPlugin } from '../../AIVaultAssistantPlugin';
import { SpellCheckEnhancementModal } from './SpellCheckModal';
import { HelpModal } from './HelpModal';

export class AIVaultAssistantMainModal extends Modal {
    constructor(app: App, private plugin: AIVaultAssistantPlugin) {
        super(app);
    }

    onOpen() {
        const contentEl = this.contentEl;

        // Add RTL support only for Arabic language
        if (this.plugin.settings.spellCheckLanguage === 'ar') {
            contentEl.addClass('rtl-content');
        }

        contentEl.createEl('h2', { text: 'AI Vault Assistant' });

        new Setting(contentEl)
            .setName('📝 Spell Check & Enhancement')
            .setDesc('5 spell check and enhancement options')
            .addButton(btn => btn
                .setButtonText('Open Enhancer')
                .setCta()
                .onClick(() => {
                    this.close();
                    new SpellCheckEnhancementModal(this.app, this.plugin).open();
                }));

        new Setting(contentEl)
            .setName('📊 Analyze Vault')
            .setDesc('Analyze all markdown files')
            .addButton(btn => btn
                .setButtonText('Start Analysis')
                .onClick(async () => {
                    this.close();
                    await this.plugin.analyzeVault();
                }));

        new Setting(contentEl)
            .setName('🔗 Smart Connections')
            .setDesc('Generate intelligent links')
            .addButton(btn => btn
                .setButtonText('Generate Links')
                .onClick(async () => {
                    this.close();
                    await this.plugin.generateSmartLinks();
                }));

        new Setting(contentEl)
            .setName('💖 Show Help & Documentation')
            .setDesc('Complete documentation and usage guide')
            .addButton(btn => btn
                .setButtonText('Open Help')
                .onClick(() => {
                    this.close();
                    new HelpModal(this.app, this.plugin.settings.spellCheckLanguage).open();
                }));
    }

    onClose() {
        this.contentEl.empty();
    }
}
