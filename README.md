# AI Vault Assistant

AI-powered spell checking, text enhancement, and smart linking for your Obsidian vault. Supports Arabic/RTL. Works on desktop and mobile.

> **v1.0** — Provider abstraction complete. Perplexity API built-in; OpenAI, Anthropic, Ollama support ready for community contributions.

## Installation

1. In Obsidian, go to **Settings → Community Plugins → Browse**
2. Search for "AI Vault Assistant"
3. Install and enable the plugin
4. Enter your API key in the plugin settings

### Manual installation

Download `main.js`, `styles.css`, and `manifest.json` from the [latest release](https://github.com/YahyaZekry/obsidian-AI-Vault-Assistant-plugin/releases) and copy them to your vault's `.obsidian/plugins/ai-vault-assistant/` folder.

## Setup

1. Get an API key from [Perplexity](https://perplexity.ai) — more providers supported via the provider setting
2. Open **Settings → AI Vault Assistant**
3. Enter your API key and select your language
4. Choose your AI provider (Perplexity is the only built-in; others can be added via `src/providers/`)
5. Adjust analysis thresholds and caching to your preference

## Commands

| Command | Description |
|---------|-------------|
| `AI Vault Assistant: Open main menu` | Hub for all features (spell check, analyze, links, help) |
| `AI Vault Assistant: Check spelling and format` | Check current note for errors |
| `AI Vault Assistant: Apply corrections` | Apply all spelling fixes to current note |
| `AI Vault Assistant: Enhance note` | AI rewrite for clarity and structure |
| `AI Vault Assistant: Analyze vault` | Scan vault for themes and content patterns |
| `AI Vault Assistant: Generate smart links` | Suggest semantic links between notes |
| `AI Vault Assistant: Show help` | Built-in documentation |

## Features

- **Spell checking with context** — Detects spelling and grammar errors using AI. Multi-pass analysis with confidence scoring. Preserves Obsidian markdown (wiki-links, code blocks, math, callouts).
- **Text enhancement** — Rewrites notes for better clarity, structure, and formatting. Automatically applies callouts, heading hierarchy, and link text improvements.
- **Smart linking** — Compares notes semantically and suggests wiki-links with relevance scores, connection types (conceptual, sequential, complementary, reference), and AI reasoning.
- **Vault analysis** — Scans all markdown files and identifies themes, topics, and content distribution.
- **Arabic / RTL** — Full Arabic spell checking with diacritic preservation, hamza variant handling, and right-to-left UI.
- **File filtering** — Automatically excludes PDFs, images, archives, and other non-markdown files from analysis.
- **Caching** — API responses cached locally to reduce costs and improve speed.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| API Key | — | Your AI provider API key |
| AI Provider | Perplexity | Select which provider to use |
| Language | English | Primary language for spell checking |
| Spell Check Model | `sonar` | Model used for error detection |
| Enhanced Rewrite Model | `sonar-reasoning-pro` | Model used for text enhancement |
| Link Analysis Model | `sonar-pro` | Model used for smart linking |
| Similarity Threshold | 0.5 | Minimum relevance score for link suggestions (0.3–0.9) |
| Cache Enabled | true | Cache API responses |
| Cache Duration | 24h | How long to keep cached results |
| Batch Size | 10 | Files processed per batch |
| Auto Format | true | Apply formatting fixes during spell check |
| Excluded Extensions | pdf, docx, png, ... | File types to skip |
| RTL Support | auto | Right-to-left text direction |

## Development

```bash
npm install
npm run dev     # rebuild on file changes
npm run build   # type-check + production bundle
```

The plugin is compiled from `src/AIVaultAssistantPlugin.ts` into `main.js`. Source maps are enabled in dev mode.

## License

MIT

---

[☕ Support on Buy Me a Coffee](https://buymeacoffee.com/YahyaZekry) •
[🐛 Report Issue](https://github.com/YahyaZekry/obsidian-AI-Vault-Assistant-plugin/issues) •
[💡 Feature Requests](https://github.com/YahyaZekry/obsidian-AI-Vault-Assistant-plugin/discussions)
