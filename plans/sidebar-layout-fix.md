# Sidebar Layout Fix Plan

## Problem Statement
The 50/50 layout between the main content container (checkbox + content + apply button) and the context container is not working correctly. Need to add a yellow debug border to visualize the container boundaries.

## Current Structure

```
correction-item (flex container)
├── correction-main-content (should be 50%)
│   ├── correction-checkbox (orange)
│   ├── correction-content (green)
│   └── correction-action (purple)
└── correction-context (should be 50%, white)
```

## Issues Identified

1. **`flex-wrap: wrap` on `.correction-item`** (line 502)
   - This causes elements to wrap to new lines when they don't fit
   - Prevents the 50/50 row layout from working

2. **Missing debug style for main content container**
   - Need to add yellow debug border to visualize `.correction-main-content`

3. **Potential flex-basis conflict**
   - The `.correction-main-content` has `flex: 0 0 50%` but parent has `flex-wrap: wrap`

## Proposed Changes

### 1. Add Yellow Debug Style for Main Content Container

Add to `styles.css` after line 104 (after other debug styles):

```css
/* Box 8 - YELLOW: Main content wrapper (checkbox + content + apply button) */
.debug-main-content {
    box-shadow: 0 0 0 3px yellow !important;
    outline: 2px dashed #b8860b !important;
    position: relative;
    background-color: rgba(255, 255, 0, 0.1);
}
.debug-main-content::after {
    content: "8-MAIN-CONTENT";
    position: absolute;
    top: -25px;
    left: 0;
    background: #b8860b;
    color: white;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: bold;
    z-index: 9999;
    white-space: nowrap;
}
```

### 2. Update HTML in SidebarView.ts

Add `debug-main-content` class to the `correction-main-content` div (around line 265):

```typescript
const mainContent = item.createDiv({ cls: 'correction-main-content debug-main-content' });
```

### 3. Fix the 50/50 Layout

Update `.correction-item` CSS (around line 493-509):

```css
.correction-item {
    display: flex;
    flex: 1 1 auto;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border: 1px solid var(--color-slate-200);
    border-radius: var(--radius-md);
    background-color: var(--color-slate-50);
    transition: all var(--transition-fast);
    flex-wrap: nowrap; /* Changed from wrap to nowrap */
    min-width: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    align-items: flex-start;
}
```

### 4. Ensure Main Content Container Takes 50%

Update `.correction-main-content` CSS (around line 512-518):

```css
.correction-main-content {
    display: flex;
    flex: 0 0 50%;
    max-width: 50%;
    min-width: 50%; /* Added to prevent shrinking */
    gap: var(--spacing-sm);
    align-items: flex-start;
}
```

### 5. Ensure Context Container Takes 50%

Update `.correction-context` CSS (around line 673-685):

```css
.correction-context {
    flex: 0 0 50%;
    max-width: 50%;
    min-width: 50%; /* Added to prevent shrinking */
    padding: var(--spacing-sm);
    background-color: var(--color-slate-100);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
}
```

## Visual Layout After Fix

```
┌─────────────────────────────────────────────────────────────┐
│ correction-item (flex, flex-wrap: nowrap)                   │
│ ┌─────────────────────────────┬───────────────────────────┐ │
│ │ 🟡 correction-main-content  │ ⬜ correction-context     │ │
│ │ (50%, yellow debug border)  │ (50%, white debug border) │ │
│ │ ┌────────┬────────┬────────┐ │                           │ │
│ │ │ 🟠     │ 🟢     │ 🟣     │ │ Context text here...      │ │
│ │ │checkbox│content │ apply  │ │                           │ │
│ │ └────────┴────────┴────────┘ │                           │ │
│ └─────────────────────────────┴───────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Files to Modify

1. **`styles.css`**
   - Add yellow debug style for `.debug-main-content`
   - Fix `.correction-item` to use `flex-wrap: nowrap`
   - Add `min-width: 50%` to `.correction-main-content`
   - Add `min-width: 50%` to `.correction-context`

2. **`src/ui/SidebarView.ts`**
   - Add `debug-main-content` class to the main content div

## Implementation Order

1. Add the yellow debug CSS style
2. Update the TypeScript to add the debug class
3. Fix the flex-wrap property
4. Add min-width constraints
5. Test in Obsidian to verify the layout

## Notes

- `display: flex` works perfectly in Obsidian (it's a web-based app using Chromium)
- The issue is likely `flex-wrap: wrap` allowing items to wrap instead of staying in a row
- Adding `min-width: 50%` ensures the containers don't shrink below 50%
