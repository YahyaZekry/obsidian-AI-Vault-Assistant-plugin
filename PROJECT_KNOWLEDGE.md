# PROJECT KNOWLEDGE — AI Vault Assistant

> Last updated: 2026-06-17
> Status: Active — Phase 2 step 8 done (provider selection UI), Phase 5 items 23/26/27 done (simpleHash, CSS !important, innerHTML XSS)

---

## What This Project Does
An Obsidian plugin that uses AI APIs (currently Perplexity, planned: OpenAI, Anthropic, Google, Ollama, any OpenAI-compatible) to provide spell checking, text enhancement, vault-wide theme analysis, and semantic wiki-link suggestions for markdown notes. Designed with Arabic/RTL support as a first-class feature.

---

## Tech Stack
| Category        | Details                              |
|-----------------|--------------------------------------|
| Language        | TypeScript 4.7                       |
| Runtime         | Obsidian (Node.js, desktop + mobile) |
| Framework       | Obsidian Plugin API                  |
| Database        | None (Obsidian vault file system)    |
| Build Tool      | esbuild 0.17.3                       |
| Styling         | CSS with custom design tokens        |
| Testing         | Jest declared but not configured     |
| Linting         | ESLint in devDeps, no config file    |
| Key Libraries   | obsidian API, builtin-modules        |
| Deployment      | Community plugin (manual install)    |

---

## Project Structure
```
├── src/
│   ├── AIVaultAssistantPlugin.ts       — Plugin entrypoint, commands, ribbon icons, recreateProvider()
│   ├── core/
│   │   ├── ErrorHandler.ts             — Error translation + retry/backoff (✅ wired into AIService + VaultAnalyzer)
│   │   ├── ProgressTracker.ts          — Progress bar UI with ETA + cancel
│   │   └── SafeFileWriter.ts           — File conflict detection modal (✅ wired into SidebarView + SpellCheckResultsModal)
│   ├── providers/
│   │   ├── AIProvider.ts              — AIProvider interface + chat completion types
│   │   ├── PerplexityProvider.ts      — Perplexity implementation via requestUrl
│   │   └── ProviderFactory.ts         — Creates provider by ID
│   ├── services/
│   │   ├── AIService.ts                — Spell check, corrections, enhancement (uses AIProvider, public provider)
│   │   ├── CacheManager.ts             — Disk-backed kv cache (stored under .obsidian/)
│   │   ├── FileFilter.ts               — Extension-based file exclusion
│   │   ├── SpellCheckStrategy.ts       — Strategy pattern: Full / Incremental / Auto
│   │   └── VaultAnalyzer.ts            — Vault analysis + smart link comparison (uses AIProvider, public provider)
│   ├── settings/
│   │   ├── defaults.ts                 — DEFAULT_SETTINGS object
│   │   ├── migration.ts                — Versioned settings migration (v1→v2)
│   │   └── SettingsTab.ts              — Settings UI with dropdowns, sliders, toggles (provider dropdown added)
│   ├── types/
│   │   └── index.ts                    — All interfaces (single source of truth)
│   ├── utils/
│   │   └── hash.ts                     — simpleHash() shared utility
│   └── ui/
│       ├── KeyboardManager.ts          — Keyboard shortcut registration (✅ Ctrl/Cmd+Shift+M/S)
│       ├── SidebarView.ts              — Docked sidebar: corrections list, apply/undo
│       ├── ThemeManager.ts             — Singleton theme manager
│       ├── ToastManager.ts             — Custom toast notifications (⚠️ skipped — Notice is standard)
│       ├── UIUtils.ts                  — Static helpers (notices, formatting)
│       └── modals/
│           ├── HelpModal.ts            — Built-in documentation
│           ├── MainModal.ts            — Feature selection: spell check / analyze / links / help
│           ├── ModelRecommendationsModal.ts — Smart links results with relevance + reasoning
│           ├── SpellCheckModal.ts      — Spell check options (3 modes) + actions
│           ├── SpellCheckResultsModal.ts — Correction review: individual/bulk apply, scroll-to-line
│           └── VaultSpellCheckModal.ts — Vault analysis results display
├── styles.css                           — 2,248-line design system + dark mode
├── manifest.json                        — Plugin ID: ai-vault-assistant
├── esbuild.config.mjs                   — Build config
├── tsconfig.json                        — TS config
├── README.md                            — User-facing documentation
├── plans/                               — Migration plan docs (historical)
└── version-bump.mjs                     — Version bump script
```

Key files:
- `src/AIVaultAssistantPlugin.ts:14` — Main plugin class, loads services, registers commands + ribbon icons
- `src/services/AIService.ts:52` — All API communication (uses AIProvider interface, no direct requestUrl)
- `src/services/VaultAnalyzer.ts:6` — Vault analysis + file comparison (uses AIProvider, getApiKey removed)
- `src/providers/AIProvider.ts:1` — AIProvider interface contract
- `src/providers/PerplexityProvider.ts:1` — Perplexity implementation
- `src/services/SpellCheckStrategy.ts:284` — Strategy factory for Full/Incremental/Auto modes
- `src/ui/SidebarView.ts:7` — Heaviest file (843 lines): sidebar rendering + correction management
- `src/types/index.ts:44` — `AIVaultAssistantSettings` with 43 fields

---

## Commands / Features
| Command ID                     | Auth | What It Does                                      |
|--------------------------------|------|---------------------------------------------------|
| `ai-spell-check`               | —    | Opens main modal with 4 spell check options       |
| `ai-vault-analysis`            | —    | Analyzes all markdown files for themes             |
| `ai-smart-links`               | —    | Generates semantic link suggestions (uses settings' linkAnalysisModel — was `sonar-medium-online`) |
| `ai-open-sidebar`              | —    | Opens docked sidebar with correction UI            |
| `Brain` ribbon icon            | —    | Opens main modal (quick access)                    |
| `Sidebar` ribbon icon          | —    | Opens sidebar view                                 |

---

## Services & Hooks
| Name                            | File                              | What It Manages / Returns                        |
|---------------------------------|-----------------------------------|---------------------------------------------------|
| `AIService`                     | `services/AIService.ts`           | Spell check, apply corrections, enhance via AIProvider |
| `CacheManager`                  | `services/CacheManager.ts`        | In-memory Map + JSON file under `.obsidian/ai-vault-cache/` |
| `VaultAnalyzer`                 | `services/VaultAnalyzer.ts`       | Vault theme analysis + smart link generation (uses AIProvider) |
| `PerplexityProvider`            | `providers/PerplexityProvider.ts` | Implements AIProvider for Perplexity API |
| `ProviderFactory`               | `providers/ProviderFactory.ts`    | Creates provider instance by ID |
| `FileFilter`                    | `services/FileFilter.ts`          | Extension-based include/exclude filtering         |
| `SpellCheckStrategyFactory`     | `services/SpellCheckStrategy.ts`  | Creates Full/Incremental/Auto strategy instances  |
| `ErrorHandler`                  | `core/ErrorHandler.ts`            | Singleton: error translation + retry (✅ wired into all 5 API calls) |
| `SafeFileWriter`                | `core/SafeFileWriter.ts`          | Conflict detection + modal (✅ wired into SidebarView + SpellCheckResultsModal) |
| `ToastManager`                  | `ui/ToastManager.ts`              | Singleton: toast notifications (⚠️ skipped — Notice API is sufficient) |
| `ThemeManager`                  | `ui/ThemeManager.ts`              | Singleton: auto/dark/light theme (✅ wired — imported in plugin) |
| `KeyboardManager`               | `ui/KeyboardManager.ts`           | Keyboard shortcut registration (✅ wired: Ctrl/Cmd+Shift+M/S) |
| `ProgressTracker`               | `core/ProgressTracker.ts`         | Progress bar with ETA, cancel button              |

---

## Component Inventory

**`ui/modals/`**
- `MainModal.ts` — Hub modal: spell check, analyze vault, smart links, help
- `HelpModal.ts` — Built-in documentation (getting started, smart linking, settings, troubleshooting)
- `SpellCheckModal.ts` — 4 options: check & show results, apply corrections, full enhancement, change mode
- `SpellCheckResultsModal.ts` — Corrections list with individual/bulk apply, scroll-to-line, highlight
- `ModelRecommendationsModal.ts` — Smart links: title, relevance %, connection type, reasoning, themes, preview, add-link button
- `VaultSpellCheckModal.ts` — Vault analysis: file counts, themes list, file type breakdown

**`ui/`**
- `SidebarView.ts` — Full sidebar: file info, corrections with checkbox/apply/confidence bar, formatting issues, quick actions (spell check, reanalyze, copy, clear), undo

---

## Environment Variables
No environment variables used. API key stored via Obsidian's `loadData/saveData`.

---

## Dev Commands
| Command           | What It Does                                              |
|-------------------|-----------------------------------------------------------|
| `npm run dev`     | Start esbuild in watch mode for development               |
| `npm run build`   | `tsc` type-check + esbuild production bundle               |
| `npm run version` | Bump version in manifest + versions.json                   |
| `npm test`        | Jest (not configured — no tests exist)                     |

---

## Spell Check Modes
| Mode          | Strategy                     | Behavior                                              |
|---------------|------------------------------|-------------------------------------------------------|
| `full`        | `FullChunkedStrategy`        | Splits by headers, processes each chunk, merges results |
| `incremental` | `IncrementalStrategy`        | Checks section-by-section (cost-safe), supports resume |
| `auto`        | `AutoStrategy`               | Checks first 5k chars, suggests full check if errors exceed threshold |

---

## External Integrations & Data Contracts
**Perplexity AI** (implemented via `PerplexityProvider`, ready for alternatives)
- API endpoint: `https://api.perplexity.ai/chat/completions` (encapsulated in provider)
- Auth: `Bearer ${apiKey}` (encapsulated in provider)
- Models: `sonar` (spell check), `sonar-pro` (link analysis — default), `sonar-reasoning-pro` (enhanced rewrite)
- Response format: OpenAI-compatible (parsed in provider)
- Returns: JSON with `corrections[]` and `formattingIssues[]` arrays, or `shouldLink + relevance + connectionType + reasoning` for link comparisons

---

## Full Audit Report (from OPUSPLAN.md)

### Project Health Score: 5/10
Solid product vision and clean modular bones, undermined by uneven execution: ~1,000 LOC of unused infrastructure, a data-corruption-class bug in the apply-correction path, a vault-polluting cache, and tight coupling to a deprecated model. UI is the most mature layer; data and IO are the weakest.

### Strengths
- **Settings migration scaffolding** (`migration.ts`) — versioned settings with future-proof `migrate()` function
- **Strategy pattern for spell-check modes** (`SpellCheckStrategy.ts:284`) — Full/Incremental/Auto cleanly abstracted
- **Header-aware chunking** (`SpellCheckStrategy.ts:92`) — sensible improvement over naive character chunking
- **Centralized type definitions** (`types/index.ts`) — single source of truth
- **Conflict-resolution UI** (`SafeFileWriter.ts:13`) — thoughtful UX, but never reached
- **CSS design tokens** (`styles.css:6-68`) — proper custom-property color scale and dark-mode overrides
- **Visual confidence indicator** (`SidebarView.ts:314`) — colored confidence bar is good UX

### Critical Flaws (🔴)
1. ✅ ~~**Global regex replacement corrupts data** — fixed: line-specific~~
2. ✅ ~~**Cache pollutes vault root** — fixed: stored under `.obsidian/`~~
3. ✅ ~~**Smart Links broken** — fixed: uses `settings.linkAnalysisModel`~~
4. ✅ ~~**No HTTP error handling** — fixed: `response.status !== 200` checks + ErrorHandler.withRetry~~
5. ✅ ~~**Uses `fetch()` not `requestUrl()`** — fixed: all 5 sites use Obsidian `requestUrl`~~
6. ✅ ~~**~1,000 LOC dead code** — ErrorHandler, SafeFileWriter, KeyboardManager, ThemeManager wired (ToastManager skipped — Notice is standard)~~
7. ✅ ~~**Silent revert thresholds** — fixed~~

### High-Severity Issues (🟠)
- ✅ ~~**Provider lock-in** — abstracted behind AIProvider interface; PerplexityProvider replaces hardcoded fetch calls~~
- ✅ ~~**Deprecated model** — replaced with `settings.linkAnalysisModel`~~
- ✅ ~~**Duplicate settings interface** — removed inline interface from AIService.ts~~
- ✅ ~~**`innerHTML` injection** — SpellCheckResultsModal now escapes user content (`&`/`<`/`>`) before injecting `<mark>` tags~~
- **Substring slicing** — Content truncated to 5k chars (spell check) / 3k chars (smart links). Long docs get partial analysis.
- **Cache race condition** — `CacheManager` fires `loadCache()` without await; concurrent `set()` calls race-write.
- ✅ ~~**3 identical `simpleHash` copies** — consolidated to `src/utils/hash.ts`; all 4 call sites import from there~~

### Low-Severity (🟡)
- **39 `any` casts** — Including plugin self-lookup by hardcoded ID string (getApiKey was removed, so this is now just 38).
- ✅ ~~**34 `!important` CSS declarations** — all removed; selectors already had sufficient specificity~~
- **17 debug console.logs** — 11 `🔍 [DEBUG]` in SidebarView alone.
- **`setTimeout` for view orchestration** — Racy; fails on slow disks.
- **Language mismatch** — README claims 5 languages, UI offers only English + Arabic.
- **No tests, no CI, no lint config** — Zero test coverage for destructive text-replacement code.

### Improvement Plan (from OPUSPLAN)

**Phase 1: Stability & Critical Fixes** ✅ COMPLETE
1. ✅ Fix global-regex text replacement — apply at specific line, not global
2. ✅ Move cache out of vault root — use plugin data file under `.obsidian/`
3. ✅ Fix deprecated model in `compareFiles` — use settings' `linkAnalysisModel`
4. ✅ Replace `fetch` with Obsidian's `requestUrl`
5. ✅ Add HTTP error handling — check `response.status !== 200` at all 5 call sites
6. ✅ Remove silent-revert thresholds — `< 50` char guard and `starts with #` guard removed

**Phase 2: Provider Refactor**
7. ✅ Introduce `AIProvider` interface — `src/providers/` folder
8. ✅ Settings: provider selection dropdown (added to SettingsTab.ts, wired via recreateProvider())
9. ⬜ Strip provider-specific parsing from prompts
10. ✅ Rebrand complete: `AIVaultAssistantPlugin`, `AIService`, `AIVaultAssistantSettings` (done in earlier session)

**Phase 3: Wire Up Dead Code** ✅ COMPLETE
11. ✅ Use `SafeFileWriter` everywhere corrections apply
12. ✅ Use `ErrorHandler.withRetry` for all API calls
13. ⬜ ~~Use `ToastManager` instead of raw `Notice`~~ (skipped — `Notice` is Obsidian-standard, ToastManager adds CSS maintenance burden without meaningful benefit)
14. ✅ Wire `ThemeManager` and `KeyboardManager`

**Phase 4: UX Polish**
15. Diff preview before applying corrections
16. Confirmation for "Apply All"
17. Reject/dismiss button per correction
18. Real progress bar with cancel
19. Cost preview before large operations
20. Accessibility pass

**Phase 5: Tooling & Hardening**
21. Jest tests for data-corruption paths
22. ESLint + Prettier + GitHub Actions
23. ✅ Consolidate `simpleHash` into util — `src/utils/hash.ts`
24. ⬜ Remove outdated plan docs from repo
25. ⬜ Remove debug logs
26. ✅ CSS audit: kill `!important` — all 34 removed
27. ✅ Replace `innerHTML` with safe DOM APIs — context text escaped before innerHTML injection
28. ⬜ Streaming responses

---

## Known Issues / TODOs
- [x] ~~Remove "Perplexity" branding everywhere~~ — rename plugin, class, services, commands, settings, UI text
- [x] ~~**CRITICAL: Global regex replacement corrupts data** — now line-specific~~
- [x] ~~**Cache pollutes vault root** — now stores under `.obsidian/ai-vault-cache/`~~
- [x] ~~**Smart Links broken** — now uses `settings.linkAnalysisModel`~~
- [x] ~~**No HTTP error handling** — `response.status !== 200` checks at all call sites~~
- [x] ~~**Uses `fetch()` not `requestUrl()`** — now uses Obsidian `requestUrl` at all 5 sites~~
- [x] ~~**Provider lock-in** — abstracted behind AIProvider interface~~
- [x] ~~**Duplicate settings interface in AIService.ts** — remove inline interface, import from types~~
- [x] ~~**Provider selection UI in settings** — add dropdown + per-provider config~~
- [ ] **Debug console.logs** — clean up before release
- [x] ~~**`!important` CSS** — refactor selectors~~
- [x] ~~**`innerHTML` XSS risk** — use safe DOM APIs~~
- [ ] **Language mismatch** — implement Spanish, French, German or fix README
- [ ] **No tests** — add test coverage for text-replacement paths
- [ ] **Cache race condition** — fix async init
- [x] ~~**3x `simpleHash`** — consolidate to util~~

---

## Decisions & Notes
- **Dead code wired up** — ErrorHandler.withRetry wraps all 5 API calls for exponential backoff + error translation + user notification. SafeFileWriter protects all file writes in SidebarView and SpellCheckResultsModal with conflict detection. KeyboardManager registers Ctrl/Cmd+Shift+M (open menu) and Ctrl/Cmd+Shift+S (open sidebar). ThemeManager imported for auto-init. ToastManager intentionally skipped — Obsidian's built-in Notice API is the standard for plugins and doesn't require custom CSS.
- **Strategy pattern for spell-check modes** — Should be replicated for AI providers (planned).
- **Rebrand complete** — Plugin renamed to "AI Vault Assistant" (provider-agnostic). All `PerplexityPlugin`, `PerplexityService`, `PerplexitySettingTab`, `PerplexityMainModal` class names replaced. CSS classes prefixed `ai-vault-`. Command IDs prefixed `ai-`. View type `ai-vault-assistant-view`. Manifest ID `ai-vault-assistant`.
- **Vault analysis uses chunked file names** — reads file names only, not content, for cost optimization.
- **Smart links compare first 3 KB only** — cost optimization that limits quality.
- **Content truncation at 5,000/3,000 chars** — long document analysis is inherently incomplete.
- **Provider swap at runtime** — `recreateProvider()` on plugin replaces provider in all consumers (plugin, AIService, VaultAnalyzer). `provider` made public on both services for this purpose.
- **simpleHash consolidated** — 4 copies (AIService, VaultAnalyzer, CacheManager, Plugin) → 1 shared function in `src/utils/hash.ts`. Private methods now delegate to the shared function.
- **CSS !important removed** — 34 declarations eliminated. Selectors already had sufficient specificity via `[data-type="ai-vault-assistant-view"]` attribute.
- **innerHTML XSS guarded** — user file content (context text) is HTML-escaped (`&`, `<`, `>`) before regex replacement for `<mark>` highlighting. HelpModal innerHTML left as-is — content is hardcoded strings, no user input.

---

## Session Log
| Date       | Summary                                         |
|------------|-------------------------------------------------|
| 2026-06-16 | Created PROJECT_KNOWLEDGE.md from full codebase scan |
| 2026-06-16 | Merged OPUSPLAN.md audit into PROJECT_KNOWLEDGE.md; flagged rebrand goal |
| 2026-06-16 | Completed full rebrand: Perplexity Plugin → AI Vault Assistant. Updated all TS files, CSS, config, documentation |
| 2026-06-16 | Updated repo URL to github.com/YahyaZekry/obsidian-AI-Vault-Assistant-plugin
| 2026-06-16 | Phase 1 complete: global-regex → line-specific (SidebarView.ts, SpellCheckResultsModal.ts), cache moved to .obsidian/, fetch → requestUrl at 5 sites, HTTP error handling added, silent-revert thresholds removed, deprecated model replaced with settings config
| 2026-06-16 | Phase 2 step 7: created AIProvider interface, PerplexityProvider, ProviderFactory. Refactored AIService and VaultAnalyzer to use AIProvider instead of direct requestUrl. Removed VaultAnalyzer.getApiKey() hack
| 2026-06-16 | Phase 3: wired ErrorHandler.withRetry into all 5 API calls, SafeFileWriter into SidebarView + SpellCheckResultsModal, KeyboardManager into plugin with 2 shortcuts |
| 2026-06-17 | Fixed innerHTML XSS in SpellCheckResultsModal (escaped user content before highlight injection). Consolidated simpleHash 4→1 in src/utils/hash.ts. Wired ThemeManager singleton. Removed 34 !important CSS declarations. Added provider selection dropdown to settings. Added recreateProvider() method. Made provider public on AIService and VaultAnalyzer |
