# Design: NekoRPG English Translation

**Date:** 2026-03-04
**Branch:** english
**Status:** Approved, ready for implementation

---

## Overview

Translate all user-visible Chinese text in NekoRPG from Chinese to English via direct inline replacement. No i18n infrastructure is introduced — strings are translated in-place. A Playwright smoke test guards against JS regressions throughout the process.

**Scope:** `src/*.js` (17 files), `index.html`. Excludes `help.html`, `changelog.html`, `changelog_old.html`.

**Scale:** ~4,085 strings across 17 JS files + 104 strings in index.html.

---

## Section 1: Glossary

A `docs/translation-glossary.md` file is created first, before any file is touched. It defines canonical English renderings for all recurring lore terms. All translators (human or AI) must reference and not deviate from the glossary.

Key term categories:
- Realm tier names (e.g. 微尘级 → Dust Rank)
- Character and faction names (proper nouns — use pinyin or invented English)
- System/mechanic names (e.g. 极寒相变引擎 → Cryo Phase Engine)
- Currency names
- Location names

See: `docs/translation-glossary.md`

---

## Section 2: Playwright Test Setup

No existing test infrastructure exists. A minimal Playwright setup is added.

**New files:**
```
NekoRPG/
├── package.json              # dev dep: @playwright/test; scripts: test, test:ui
├── playwright.config.js      # static file server pointing at project root
└── tests/
    └── smoke.spec.js         # loads game, asserts zero JS errors + key DOM elements exist
```

**Test behavior:**
- Serves `index.html` via Playwright's built-in static server
- Collects all `console.error` and `page.on('pageerror')` events
- Asserts zero JS errors after page load + 2s settle time
- Asserts key DOM elements exist (inventory div, character stats div, etc.)

**Run command:** `npm test`

---

## Section 3: Translation Plan Document

`docs/translation-plan.md` tracks per-file progress with status indicators and string counts.

**Translation order (priority: gameplay impact):**

| Order | File | Strings | Status |
|-------|------|---------|--------|
| 1 | `main.js` (root) | ~293 | ⬜ |
| 2 | `index.html` | ~104 | ⬜ |
| 3 | `src/items.js` | ~562 | ⬜ |
| 4 | `src/enemies.js` | ~788 | ⬜ |
| 5 | `src/locations.js` | ~764 | ⬜ |
| 6 | `src/dialogues.js` | ~265 | ⬜ |
| 7 | `src/crafting_recipes.js` | ~292 | ⬜ |
| 8 | `src/display.js` | ~284 | ⬜ |
| 9 | `src/skills.js` | ~135 | ⬜ |
| 10 | `src/traders.js` | ~121 | ⬜ |
| 11 | `src/active_effects.js` | ~48 | ⬜ |
| 12 | `src/combat_stances.js` | ~20 | ⬜ |
| 13 | `src/character.js` | ~18 | ⬜ |
| 14 | `src/misc.js` | ~10 | ⬜ |
| 15 | `src/activities.js` | ~8 | ⬜ |
| 16 | `src/trade.js` | ~1 | ⬜ |
| 17 | `src/game_time.js` | ~3 | ⬜ |

---

## Section 4: Translation Workflow (Per File)

For each file:
1. Read fully to understand context
2. Apply glossary terms consistently
3. Translate user-facing strings inline — preserve all code structure, variable names, property keys, logic
4. Mark file complete in `docs/translation-plan.md`
5. Commit with message: `translate: <filename>`

**What gets translated:**
- Display names, descriptions, dialogue text, UI labels
- Template literal strings that render to the user

**What does NOT get translated:**
- Internal string keys used as identifiers (e.g. `item_name: "魔力碎晶"` — the key stays, only the `name:` display field is translated)
- Code comments
- File/function/variable names
- Console.log debug strings

**Special care — dual-use strings:** Some strings appear both as lookup keys and display values. The key (used in code logic) must remain unchanged. Only the display `name:` field is translated.

---

## Section 5: Regression Testing Strategy

The Playwright smoke test is the regression guard throughout translation.

**When to run:** After each file is translated and committed — `npm test`.

**What it catches:**
- Syntax errors introduced during editing
- Broken template literals
- String encoding issues
- JS runtime crashes on page load

**What it does not catch:**
- Mistranslations (human review via PR/diff)
- Missing translations (tracked via `docs/translation-plan.md`)

**CI:** Not in scope. Manual test run after each file. GitHub Actions can be added later.
