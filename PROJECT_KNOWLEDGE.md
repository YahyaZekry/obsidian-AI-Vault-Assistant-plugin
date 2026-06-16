# PROJECT KNOWLEDGE — AI Vault Assistant

> Last updated: 2026-06-16
> Status: Active — Phase 1 (stability fixes) complete; provider abstraction is next goal

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
│   ├── AIVaultAssistantPlugin.ts       — Plugin entrypoint, commands, ribbon icons
│   ├── core/
│   │   ├── ErrorHandler.ts             — Error translation + retry/backoff (⚠️ UNUSED)
│   │   ├── ProgressTracker.ts          — Progress bar UI with ETA + cancel
│   │   └── SafeFileWriter.ts           — File conflict detection modal (⚠️ UNUSED)
│   ├── services/
│   │   ├── AIService.ts                — API calls: spell check, corrections, enhancement
│   │   ├── CacheManager.ts             — Disk-backed kv cache (stored under .obsidian/)
│   │   ├── FileFilter.ts               — Extension-based file exclusion
│   │   ├── SpellCheckStrategy.ts       — Strategy pattern: Full / Incremental / Auto
│   │   └── VaultAnalyzer.ts            — Vault analysis + smart link comparison
│   ├── settings/
│   │   ├── defaults.ts                 — DEFAULT_SETTINGS object
│   │   ├── migration.ts                — Versioned settings migration (v1→v2)
│   │   └── SettingsTab.ts              — Settings UI with dropdowns, sliders, toggles
│   ├── types/
│   │   └── index.ts                    — All interfaces (single source of truth)
│   └── ui/
│       ├── KeyboardManager.ts          — Keyboard shortcut registration (⚠️ UNUSED)
│       ├── SidebarView.ts              — Docked sidebar: corrections list, apply/undo
│       ├── ThemeManager.ts             — Singleton theme manager
│       ├── ToastManager.ts             — Custom toast notifications (⚠️ UNUSED)
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
- `src/services/AIService.ts:52` — All API communication (uses Obsidian requestUrl, HTTP error handling added, silent revert thresholds removed)
- `src/services/VaultAnalyzer.ts:6` — Vault analysis + file comparison for smart links
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
| `AIService`                     | `services/AIService.ts`           | Spell check, apply corrections, enhance via API   |
| `CacheManager`                  | `services/CacheManager.ts`        | In-memory Map + JSON file under `.obsidian/ai-vault-cache/` |
| `VaultAnalyzer`                 | `services/VaultAnalyzer.ts`       | Vault theme analysis + smart link generation      |
| `FileFilter`                    | `services/FileFilter.ts`          | Extension-based include/exclude filtering         |
| `SpellCheckStrategyFactory`     | `services/SpellCheckStrategy.ts`  | Creates Full/Incremental/Auto strategy instances  |
| `ErrorHandler`                  | `core/ErrorHandler.ts`            | Singleton: error translation + retry (UNUSED)     |
| `SafeFileWriter`                | `core/SafeFileWriter.ts`          | Conflict detection + modal (UNUSED)               |
| `ToastManager`                  | `ui/ToastManager.ts`              | Singleton: toast notifications (UNUSED)           |
| `ThemeManager`                  | `ui/ThemeManager.ts`              | Singleton: auto/dark/light theme                  |
| `KeyboardManager`               | `ui/KeyboardManager.ts`           | Keyboard shortcut registration (UNUSED)           |
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
**Perplexity AI** (current, being abstracted to support multiple providers)
- API endpoint: `https://api.perplexity.ai/chat/completions`
- Auth: `Bearer ${apiKey}`
- Models: `sonar` (spell check), `sonar-pro` (link analysis — default), `sonar-reasoning-pro` (enhanced rewrite)
- Response format: OpenAI-compatible `data.choices[0].message.content`
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
1. **Global regex replacement corrupts data** — `SidebarView.ts:570/608/651` and `SpellCheckResultsModal.ts:163` replace text globally instead of at the reported line. Fixes one spelling and silently rewrites every other occurrence, including inside code blocks.
2. **Cache pollutes vault root** — `CacheManager.ts:11` writes `ai-vault-cache` as a visible file. Must use plugin data file or `.obsidian/plugins/` path.
3. **Smart Links broken** — `VaultAnalyzer.ts:204` uses deprecated model `sonar-medium-online`. Always returns 0 suggestions.
4. **No HTTP error handling** — `AIService.ts:220` crashes on 401/429/500.
5. **Uses `fetch()` not `requestUrl()`** — Breaks on mobile (CORS). `isDesktopOnly: false` is a lie.
6. **~1,000 LOC dead code** — `SafeFileWriter`, `ErrorHandler`, `KeyboardManager`, `ToastManager` fully implemented but never instantiated.
7. **Silent revert thresholds** — `AIService.ts:374` reverts corrections if ≤50 chars; `:412` reverts enhancement if not starting with `#`.

### High-Severity Issues (🟠)
- **Provider lock-in** — 5 hardcoded `fetch('https://api.perplexity.ai/chat/completions')` calls, no provider abstraction.
- **Deprecated model** — `sonar-medium-online` removed by Perplexity; `compareFiles` always fails.
- **Duplicate settings interface** — `AIVaultAssistantSettings` defined twice (types/index.ts + AIService.ts:21), diverged.
- **`innerHTML` injection** — `SpellCheckResultsModal.ts:69/125` — AI output flows into `.innerHTML`, XSS risk.
- **Substring slicing** — Content truncated to 5k chars (spell check) / 3k chars (smart links). Long docs get partial analysis.
- **Cache race condition** — `CacheManager` fires `loadCache()` without await; concurrent `set()` calls race-write.
- **3 identical `simpleHash` copies** — Duplicated across 4 files.

### Low-Severity (🟡)
- **39 `any` casts** — Including plugin self-lookup by hardcoded ID string.
- **34 `!important` CSS declarations** — Layout breaks on Obsidian theme upgrades.
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

**Phase 2: Provider Refactor** (current goal)
7. Introduce `AIProvider` interface — `src/providers/` folder
8. Settings: provider + model selection UI
9. Strip provider-specific parsing from prompts
10. ✅ Rebrand complete: `AIVaultAssistantPlugin`, `AIService`, `AIVaultAssistantSettings`

**Phase 3: Wire Up Dead Code**
11. Use `SafeFileWriter` everywhere corrections apply
12. Use `ErrorHandler.withRetry` for all API calls
13. Use `ToastManager` instead of raw `Notice`
14. Wire `ThemeManager` and `KeyboardManager`

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
23. Consolidate `simpleHash` into util
24. Remove outdated plan docs from repo
25. Remove debug logs
26. CSS audit: kill `!important`
27. Replace `innerHTML` with safe DOM APIs
28. Streaming responses

---

## Known Issues / TODOs
- [x] ~~Remove "Perplexity" branding everywhere~~ — rename plugin, class, services, commands, settings, UI text
- [x] ~~**CRITICAL: Global regex replacement corrupts data** — now line-specific~~
- [x] ~~**Cache pollutes vault root** — now stores under `.obsidian/ai-vault-cache/`~~
- [x] ~~**Smart Links broken** — now uses `settings.linkAnalysisModel`~~
- [x] ~~**No HTTP error handling** — `response.status !== 200` checks at all call sites~~
- [x] ~~**Uses `fetch()` not `requestUrl()`** — now uses Obsidian `requestUrl` at all 5 sites~~
- [ ] **Dead code** — wire up SafeFileWriter, ErrorHandler, KeyboardManager, ToastManager
- [x] ~~**Silent revert thresholds** — removed~~
- [ ] **Duplicate settings interface in AIService.ts** — remove inline interface, import from types
- [ ] **Debug console.logs** — clean up before release
- [ ] **`!important` CSS** — refactor selectors
- [ ] **`innerHTML` XSS risk** — use safe DOM APIs
- [ ] **Language mismatch** — implement Spanish, French, German or fix README
- [ ] **No tests** — add test coverage for text-replacement paths
- [ ] **Cache race condition** — fix async init
- [ ] **3x `simpleHash`** — consolidate to util

---

## Decisions & Notes
- **Strategy pattern for spell-check modes** — Should be replicated for AI providers (planned).
- **Provider abstraction** is the current goal — `AIProvider` interface, `ProviderFactory`, multi-provider settings.
- **Rebrand complete** — Plugin renamed to "AI Vault Assistant" (provider-agnostic). All `PerplexityPlugin`, `PerplexityService`, `PerplexitySettingTab`, `PerplexityMainModal` class names replaced. CSS classes prefixed `ai-vault-`. Command IDs prefixed `ai-`. View type `ai-vault-assistant-view`. Manifest ID `ai-vault-assistant`.
- **Vault analysis uses chunked file names** — reads file names only, not content, for cost optimization.
- **Smart links compare first 3 KB only** — cost optimization that limits quality.
- **Content truncation at 5,000/3,000 chars** — long document analysis is inherently incomplete.

---

## Session Log
| Date       | Summary                                         |
|------------|-------------------------------------------------|
| 2026-06-16 | Created PROJECT_KNOWLEDGE.md from full codebase scan |
| 2026-06-16 | Merged OPUSPLAN.md audit into PROJECT_KNOWLEDGE.md; flagged rebrand goal |
| 2026-06-16 | Completed full rebrand: Perplexity Plugin → AI Vault Assistant. Updated all TS files, CSS, config, documentation |
| 2026-06-16 | Updated repo URL to github.com/YahyaZekry/obsidian-AI-Vault-Assistant-plugin
| 2026-06-16 | Phase 1 complete: global-regex → line-specific (SidebarView.ts, SpellCheckResultsModal.ts), cache moved to .obsidian/, fetch → requestUrl at 5 sites, HTTP error handling added, silent-revert thresholds removed, deprecated model replaced with settings config |
