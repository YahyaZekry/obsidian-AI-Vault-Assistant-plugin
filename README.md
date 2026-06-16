# AI Vault Assistant

AI-powered vault management with spell checking, text enhancement, and smart linking. Works on desktop and mobile.

## Features

- **Spell Check & Formatting** — Context-aware correction that preserves markdown syntax, code blocks, and wiki-links. Supports multi-pass detection with confidence scoring.
- **Smart Linking** — Semantic link suggestions between notes with relevance scoring, connection type classification, and AI reasoning.
- **Text Enhancement** — AI-powered rewrite to improve clarity, structure, and Obsidian-native formatting (callouts, headings, wiki-links).
- **Vault Analysis** — Scans all markdown files to identify themes, topics, and content patterns.
- **Arabic / RTL Support** — First-class Arabic spell checking, right-to-left layout, diacritic preservation.
- **Mobile Ready** — Uses Obsidian's cross-platform `requestUrl` API. No desktop-only restrictions.
- **Caching & Performance** — API responses cached under `.obsidian/` to reduce costs and improve speed. Batch processing for large vaults.
- **File Filtering** — Automatically excludes binary and non-markdown files from analysis.

## Setup

1. Get an API key from your AI provider (currently supports [Perplexity](https://perplexity.ai))
2. Open Obsidian Settings → Community Plugins → AI Vault Assistant
3. Enter your API key and select your language
4. Configure file exclusions, analysis mode, and similarity threshold to taste

## Commands

| Command                          | Description                                      |
|----------------------------------|--------------------------------------------------|
| `AI Vault Assistant: Main menu` | Opens hub: spell check, analyze vault, smart links, help |
| `AI Vault Assistant: Check spelling and format` | Check current file for errors |
| `AI Vault Assistant: Analyze vault` | Scan all markdown files for themes |
| `AI Vault Assistant: Generate smart links` | Semantic link suggestions for current file or entire vault |
| `AI Vault Assistant: Show help` | Built-in documentation |

## Language Support

- **English** — Full spell checking and analysis
- **Arabic** — RTL support, diacritic preservation, hamza variant tolerance, ة/ه context handling
- Spanish, French, German — Grammar and accent checking (prompts available, language-specific optimization planned)

## Smart Linking

Two modes:

- **Current File** (default) — Compares the active note against your vault for focused suggestions
- **All Files** — Vault-wide relationship analysis (more resource-intensive)

Each suggestion includes relevance percentage, connection type (Conceptual / Sequential / Complementary / Reference), detailed reasoning, shared themes, and a content preview.

## Configuration

- **API Key** — Stored in Obsidian's encrypted settings
- **Language** — Primary language for spell checking
- **Spell Check Model** — Model used for correction (default: `sonar`)
- **Enhancement Model** — Model used for rewrite (default: `sonar-reasoning-pro`)
- **Link Analysis Model** — Model used for smart linking (default: `sonar-pro`)
- **Similarity Threshold** — Minimum score for link suggestions (0.3–0.9)
- **Cache Duration** — How long to cache API responses (in hours)
- **Batch Size** — Files processed per batch during vault operations
- **Excluded Extensions** — File types to skip in analysis
- **Auto Format** — Automatically apply formatting fixes during spell check

## Development

```bash
npm install
npm run dev    # watch mode
npm run build  # type-check + production bundle
```

### Architecture

The plugin uses a service-based architecture:
- `AIService` — API communication via Obsidian `requestUrl`, error handling, caching layer
- `SpellCheckStrategy` — Strategy pattern for Full / Incremental / Auto check modes
- `VaultAnalyzer` — Theme analysis and file comparison for smart links
- `CacheManager` — In-memory Map with JSON persistence under `{vault}/.obsidian/ai-vault-cache/`
- `FileFilter` — Extension-based include/exclude filtering

## Privacy & Security

- API keys stored in Obsidian's encrypted plugin settings
- Only markdown file content sent to the AI provider
- No permanent storage on external servers
- File filtering runs locally — binary files never transmitted

## Changelog

### v1.1.0 (2025-10-11)
- Enhanced smart linking with detailed AI reasoning
- Two analysis modes: Current File and All Files
- File type exclusion settings with visual display
- Connection type classification (Conceptual, Sequential, etc.)
- Common themes identification for link suggestions
- Preview target files before adding links
- Vault analysis with file type breakdown
- Arabic and RTL language support
- Performance optimizations for large vaults

### v1.0.0 (2025-10-11)
- Initial release

## License

MIT

---

**[☕ Support on Buy Me a Coffee](https://buymeacoffee.com/YahyaZekry)** •
**[🐛 Report Issues](https://github.com/YahyaZekry/obsidian-AI-Vault-Assistant-plugin/issues)** •
**[💡 Request Features](https://github.com/YahyaZekry/obsidian-AI-Vault-Assistant-plugin/discussions)**
