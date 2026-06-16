import { Plugin, Notice, TFile, App, WorkspaceLeaf } from 'obsidian';
import { AIVaultAssistantSettingTab } from './settings/SettingsTab';
import { CacheManager } from './services/CacheManager';
import { VaultAnalyzer } from './services/VaultAnalyzer';
import { AIService } from './services/AIService';
import { AIVaultAssistantMainModal } from './ui/modals/MainModal';
import { VaultAnalysisModal } from './ui/modals/VaultSpellCheckModal';
import { SmartLinksModal } from './ui/modals/ModelRecommendationsModal';
import { SidebarView, SIDEBAR_VIEW_TYPE } from './ui/SidebarView';
import { migrate } from './settings/migration';
import { AIVaultAssistantSettings, SpellCheckResult, SpellCheckContext, SpellCheckMode } from './types/index';
import { DEFAULT_SETTINGS } from './settings/defaults';

export class AIVaultAssistantPlugin extends Plugin {
    settings: AIVaultAssistantSettings;
    cacheManager: CacheManager;
    vaultAnalyzer: VaultAnalyzer;
    aiService: AIService;

    async onload() {
        console.log('AI Vault Assistant Plugin loading...');

        await this.loadSettings();

        this.addSettingTab(new AIVaultAssistantSettingTab(this.app, this));

        this.cacheManager = new CacheManager(this.app);
        this.vaultAnalyzer = new VaultAnalyzer(this.app, this.cacheManager, this.settings);
        this.aiService = new AIService(this.cacheManager, this.settings);

        // Register sidebar view
        this.registerView(SIDEBAR_VIEW_TYPE, (leaf) => new SidebarView(leaf, this));

        // Add PRIMARY ribbon icon for sidebar view
        this.addRibbonIcon('layout-sidebar-right', 'Open AI Vault Sidebar', () => {
            this.activateSidebarView();
        });

        // Add brain icon ribbon for quick modal access
        this.addRibbonIcon('brain', 'AI Vault Assistant', () => {
            new AIVaultAssistantMainModal(this.app, this).open();
        });

        this.addCommand({
            id: 'ai-spell-check',
            name: 'Spell Check & Enhancement',
            callback: () => new AIVaultAssistantMainModal(this.app, this).open()
        });

        this.addCommand({
            id: 'ai-vault-analysis',
            name: 'Analyze Vault',
            callback: () => this.analyzeVault()
        });

        this.addCommand({
            id: 'ai-smart-links',
            name: 'Generate Smart Links',
            callback: () => this.generateSmartLinks()
        });

        this.addCommand({
            id: 'ai-open-sidebar',
            name: 'Open AI Vault Sidebar',
            callback: () => this.activateSidebarView()
        });

        console.log('Plugin loaded successfully');
    }

    async loadSettings() {
        const loadedData = await this.loadData();
        this.settings = migrate(Object.assign({}, DEFAULT_SETTINGS, loadedData));
        await this.saveSettings();
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    openSettings() {
        (this.app as any).setting.open();
        (this.app as any).setting.openTabById('ai-vault-assistant');
    }

    async analyzeVault() {
        if (!this.settings.apiKey) {
            new Notice('Please configure your API key in settings');
            return;
        }

        const notice = new Notice('Analyzing vault...', 0);

        try {
            const analysis = await this.vaultAnalyzer.analyzeVault();

            notice.hide();
            new Notice(`Vault analyzed: ${analysis.markdownFiles} markdown files with themes: ${analysis.themes.join(', ')}`);

            new VaultAnalysisModal(this.app, analysis, this.settings.spellCheckLanguage).open();
        } catch (error) {
            notice.hide();
            new Notice(`Analysis failed: ${error.message}`);
        }
    }

    async generateSmartLinks() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('Please open a markdown file first');
            return;
        }

        if (!this.settings.apiKey) {
            new Notice('Please configure your API key in settings');
            return;
        }

        const notice = new Notice('Generating smart links...', 0);

        try {
            const mode = this.settings.smartLinkingMode || 'current';
            const suggestions = await this.vaultAnalyzer.generateSmartLinks(mode);

            notice.hide();
            new Notice(`Generated ${suggestions.length} smart link suggestions`);

            new SmartLinksModal(this.app, activeFile, suggestions, this.settings.spellCheckLanguage).open();
        } catch (error) {
            notice.hide();
            new Notice(`Smart links failed: ${error.message}`);
        }
    }

    simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    activateSidebarView() {
        const existingLeaf = this.app.workspace.getLeavesOfType(SIDEBAR_VIEW_TYPE)[0];
        if (existingLeaf) {
            this.app.workspace.revealLeaf(existingLeaf);
        } else {
            const leaf = this.app.workspace.getRightLeaf(false);
            if (leaf) {
                leaf.setViewState({
                    type: SIDEBAR_VIEW_TYPE,
                    active: true,
                });
            }
        }
    }

    onunload() {
        console.log('AI Vault Assistant Plugin unloading');
    }
}

export default AIVaultAssistantPlugin;
