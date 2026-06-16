import { App, Notice } from 'obsidian';

interface CacheEntry {
    value: any;
    timestamp: number;
    ttl: number;
}

export class CacheManager {
    private cache: Map<string, CacheEntry> = new Map();
    private app: App;
    private cacheDir: string;

    constructor(app: App) {
        this.app = app;
        this.cacheDir = app.vault.configDir + '/ai-vault-cache';
        this.loadCache();
    }

    private cachePath(): string {
        return this.cacheDir + '/cache.json';
    }

    private async ensureDir(): Promise<void> {
        try {
            if (!(await this.app.vault.adapter.exists(this.cacheDir))) {
                await this.app.vault.adapter.mkdir(this.cacheDir);
            }
        } catch {
            // directory may already exist
        }
    }

    private async loadCache(): Promise<void> {
        try {
            await this.ensureDir();
            const stored = await this.app.vault.adapter.read(this.cachePath());
            if (stored) {
                const parsed = JSON.parse(stored);
                this.cache = new Map(Object.entries(parsed));
            }
        } catch (error) {
            this.cache = new Map();
        }
    }

    private async saveCache(): Promise<void> {
        try {
            await this.ensureDir();
            const entries = Array.from(this.cache.entries());
            const data = Object.fromEntries(entries);
            await this.app.vault.adapter.write(this.cachePath(), JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save cache:', error);
        }
    }

    async get(key: string, ttl: number): Promise<any> {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        const now = Date.now();
        const age = now - entry.timestamp;
        const isExpired = age > entry.ttl;

        if (isExpired) {
            this.cache.delete(key);
            await this.saveCache();
            return null;
        }

        return entry.value;
    }

    async set(key: string, value: any, ttl: number): Promise<void> {
        const entry: CacheEntry = {
            value,
            timestamp: Date.now(),
            ttl
        };
        
        this.cache.set(key, entry);
        await this.saveCache();
    }

    async invalidate(pattern: string): Promise<void> {
        const regex = new RegExp(pattern);
        
        for (const [key] of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
        
        await this.saveCache();
    }

    async clear(): Promise<void> {
        this.cache.clear();
        await this.saveCache();
    }

    private generateKey(content: string, model: string, language: string): string {
        const hash = this.simpleHash(content + model + language);
        return `aivault:${hash}:${model}:${language}:${Date.now()}`;
    }

    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
