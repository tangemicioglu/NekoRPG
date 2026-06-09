# English Translation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Translate all user-visible Chinese text in NekoRPG to English via direct inline replacement, with a Playwright smoke test guarding against regressions.

**Architecture:** Direct inline replacement in 17 JS files + index.html. A glossary doc ensures consistency. Playwright runs after each file commit. No i18n infrastructure introduced.

**Tech Stack:** Vanilla HTML/JS (no bundler), Playwright for smoke testing, `serve` for local static file serving during tests.

---

## Task 1: Set up Playwright infrastructure

**Files:**
- Create: `package.json`
- Create: `playwright.config.js`
- Create: `tests/smoke.spec.js`

**Step 1: Create package.json**

```json
{
  "name": "nekorphg",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.41.0",
    "serve": "^14.2.0"
  }
}
```

**Step 2: Install dependencies**

```bash
npm install
npx playwright install chromium
```

Expected: node_modules created, chromium browser downloaded.

**Step 3: Create playwright.config.js**

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npx serve . -p 3000 --no-clipboard',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 4: Create tests/smoke.spec.js**

```js
import { test, expect } from '@playwright/test';

test('game loads without JS errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');

  // Wait for loading screen to disappear (game has finished initializing)
  await expect(page.locator('#loading_screen')).toBeHidden({ timeout: 10000 });

  // Assert key structural elements exist and are visible
  await expect(page.locator('#main_content')).toBeVisible();
  await expect(page.locator('#basic_character_info_div')).toBeVisible();
  await expect(page.locator('#inventory_div')).toBeVisible();
  await expect(page.locator('#combat_div')).toBeVisible();

  // Assert zero JS errors
  expect(errors, `JS errors found: ${errors.join('\n')}`).toHaveLength(0);
});
```

**Step 5: Run the test to establish a green baseline**

```bash
npm test
```

Expected output: `1 passed` — this confirms the baseline works before any translation.

If the test fails, investigate the error before proceeding. Do NOT continue until this test is green.

**Step 6: Commit**

```bash
git add package.json playwright.config.js tests/smoke.spec.js package-lock.json
git commit -m "test: add Playwright smoke test for JS error regression"
```

---

## Task 2: Build the translation glossary

**Files:**
- Create: `docs/translation-glossary.md`

**Step 1: Scan for recurring Chinese terms**

Read each of the following files in full and collect all recurring/important Chinese terms that need consistent translation:
- `main.js` (root level) — realm names are used across many files
- `src/items.js` — item names referenced in other files
- `src/enemies.js` — enemy names
- `src/locations.js` — location names
- `src/skills.js` — skill names

**Step 2: Create docs/translation-glossary.md**

Build the glossary from what you find. It must cover at minimum:

```markdown
# Translation Glossary

All translation work must reference this document. Never deviate from established terms.

## Realm Tiers (境界)

| Chinese | Pinyin | English |
|---------|--------|---------|
| 境界 | jìngjiè | Realm |
| 微尘级 | wēichén jí | Dust Rank |
| 大地级 | dàdì jí | Earth Rank |
| 天空级 | tiānkōng jí | Sky Rank |
| 云霄级 | yúnxiāo jí | Nimbus Rank |
| 血洛级 | xuèluò jí | Xuelo Rank |
| 初级 | chūjí | Novice |
| 中级 | zhōngjí | Adept |
| 高级 | gāojí | Expert |
| 一阶/二阶/三阶... | | Stage 1 / Stage 2 / Stage 3... |

## Characters & Factions

| Chinese | English |
|---------|---------|
| 喵可 | Neko |
| 纳家 | Na Clan |
| 燕岗领 | Yangang Territory |
| (add more as found) | |

## Currency

| Chinese | English |
|---------|---------|
| (fill in from main.js) | |

## Systems & Mechanics

| Chinese | English |
|---------|---------|
| 活塞 | Piston |
| 极寒相变引擎 | Cryo Phase Engine |
| 隔热袋 | Insulation Bag |
| 秘境 | Secret Realm |
| (add more as found) | |

## Locations

| Chinese | English |
|---------|---------|
| (fill in from locations.js) | |

## Items (frequently cross-referenced)

| Chinese | English |
|---------|---------|
| (fill in from items.js — only items referenced in multiple files) | |

## Skills

| Chinese | English |
|---------|---------|
| (fill in from skills.js) | |

## UI Terms

| Chinese | English |
|---------|---------|
| 价值排序 | Sort by Value |
| 名称排序 | Sort by Name |
| 全部 | All |
| 装备 | Equipment |
| 消耗品 | Consumables |
| 掉落物 | Drops |
| 杂项 | Miscellaneous |
| 物品栏 | Inventory |
| 战斗 | Combat |
| 无效果 | No Effects |
| (add more as found) | |
```

Fill in all table rows completely before moving to Step 3. The glossary must be comprehensive — it prevents inconsistency across all 17 files.

**Step 3: Commit**

```bash
git add docs/translation-glossary.md
git commit -m "docs: add translation glossary"
```

---

## Task 3: Create translation tracking plan

**Files:**
- Create: `docs/translation-plan.md`

**Step 1: Create docs/translation-plan.md**

```markdown
# Translation Progress

See also: [Glossary](translation-glossary.md)

## Files

| # | File | Est. Strings | Status |
|---|------|-------------|--------|
| 1 | `main.js` (root) | ~293 | ⬜ Pending |
| 2 | `index.html` | ~104 | ⬜ Pending |
| 3 | `src/items.js` | ~562 | ⬜ Pending |
| 4 | `src/enemies.js` | ~788 | ⬜ Pending |
| 5 | `src/locations.js` | ~764 | ⬜ Pending |
| 6 | `src/dialogues.js` | ~265 | ⬜ Pending |
| 7 | `src/crafting_recipes.js` | ~292 | ⬜ Pending |
| 8 | `src/display.js` | ~284 | ⬜ Pending |
| 9 | `src/skills.js` | ~135 | ⬜ Pending |
| 10 | `src/traders.js` | ~121 | ⬜ Pending |
| 11 | `src/active_effects.js` | ~48 | ⬜ Pending |
| 12 | `src/combat_stances.js` | ~20 | ⬜ Pending |
| 13 | `src/character.js` | ~18 | ⬜ Pending |
| 14 | `src/misc.js` | ~10 | ⬜ Pending |
| 15 | `src/activities.js` | ~8 | ⬜ Pending |
| 16 | `src/trade.js` | ~1 | ⬜ Pending |
| 17 | `src/game_time.js` | ~3 | ⬜ Pending |

## Translation Rules

1. Always check the glossary before translating a term
2. Translate display strings only — not internal code keys/identifiers
3. Preserve all JS syntax exactly (no added/removed brackets, commas, etc.)
4. Item/enemy names used as lookup keys stay in Chinese — only the `name:` display field is translated
5. Run `npm test` after each file commit
```

**Step 2: Commit**

```bash
git add docs/translation-plan.md
git commit -m "docs: add translation progress tracker"
```

---

## Task 4: Translate main.js (root level)

**Files:**
- Modify: `main.js`
- Modify: `docs/translation-plan.md`

**Step 1: Read main.js in full**

Read `/mnt/c/Users/maxim/Documents/Code/NekoRPG/main.js` completely before making any changes.

**Step 2: Identify all Chinese strings**

The primary content is `window.REALMS` — an array of realm tier definitions. Each entry has a Chinese name string. These realm names are referenced across many other files, so translate them exactly as specified in the glossary.

Also look for:
- Any other Chinese strings in this file (UI labels, descriptions, etc.)

**Step 3: Translate all Chinese strings inline**

Rules:
- Realm names: use glossary exactly (e.g. `"微尘级初级"` → `"Dust Rank: Novice"`)
- Do NOT change array indices, numeric values, or the `"basic"`/`"advanced"` classification strings
- Do NOT translate variable names or property keys

**Step 4: Run smoke test**

```bash
npm test
```

Expected: `1 passed`. If it fails, fix the syntax error before committing.

**Step 5: Update translation-plan.md** — change row 1 to `✅ Done`

**Step 6: Commit**

```bash
git add main.js docs/translation-plan.md
git commit -m "translate: main.js (realm names and core progression)"
```

---

## Task 5: Translate index.html

**Files:**
- Modify: `index.html`
- Modify: `docs/translation-plan.md`

**Step 1: Read index.html in full**

Read `/mnt/c/Users/maxim/Documents/Code/NekoRPG/index.html` completely.

**Step 2: Identify all Chinese strings**

Key areas to find Chinese text:
- Inventory sort buttons (lines ~89-90): `价值排序`, `名称排序`
- Inventory filter buttons (lines ~93-97): `全部`, `装备`, `消耗品`, `掉落物`, `杂项`
- Character rank div (line ~66): `燕岗领排名:...`
- Effects tooltip (line ~30): `无效果`
- Combat/inventory toggle buttons
- Any `<span>` or `<div>` text content with Chinese

**Step 3: Translate all Chinese strings inline**

Use glossary UI terms table. HTML attributes (like `onclick`) are code — do not translate. Only translate visible text content between tags.

**Step 4: Run smoke test**

```bash
npm test
```

Expected: `1 passed`.

**Step 5: Update translation-plan.md** — change row 2 to `✅ Done`

**Step 6: Commit**

```bash
git add index.html docs/translation-plan.md
git commit -m "translate: index.html (UI labels)"
```

---

## Task 6: Translate src/items.js

**Files:**
- Modify: `src/items.js`
- Modify: `docs/translation-glossary.md` (add any new recurring terms)
- Modify: `docs/translation-plan.md`

**Step 1: Read src/items.js in full**

**Step 2: Understand the data structure**

Items follow this pattern:
```js
item_templates["魔力碎晶"] = new Item({
    name: "魔力碎晶",          // ← translate this display name
    description: "...",        // ← translate description
    // ... other fields
});
```

CRITICAL: The string key `item_templates["魔力碎晶"]` is a code identifier — it is used as a lookup key in `loot_list`, `crafting_recipes.js`, and other files. **DO NOT translate the key string.** Only translate the `name:` and `description:` values inside the object.

**Step 3: Translate all name: and description: fields**

For each item:
- `name:` — translate to English using glossary if the item is already listed, otherwise invent a fitting English name
- `description:` — translate the description text
- Any other user-visible string fields

If you invent new item name translations, add them to `docs/translation-glossary.md` under "Items".

**Step 4: Run smoke test**

```bash
npm test
```

Expected: `1 passed`.

**Step 5: Update translation-plan.md** — change row 3 to `✅ Done`

**Step 6: Commit**

```bash
git add src/items.js docs/translation-glossary.md docs/translation-plan.md
git commit -m "translate: src/items.js (item names and descriptions)"
```

---

## Task 7: Translate src/enemies.js

**Files:**
- Modify: `src/enemies.js`
- Modify: `docs/translation-glossary.md` (add new enemy names)
- Modify: `docs/translation-plan.md`

**Step 1: Read src/enemies.js in full**

**Step 2: Understand the data structure**

```js
enemy_templates["血洛游卒"] = new Enemy({
    name: "血洛游卒",          // ← translate display name
    description: "...",        // ← translate description
    loot_list: [
        {item_name: "魔力碎晶", chance: 0.1},  // ← item_name is a KEY, do NOT translate
    ],
});
```

CRITICAL: `item_name:` values inside `loot_list` are lookup keys — do NOT translate them. Only `name:` and `description:` get translated.

**Step 3: Translate all name: and description: fields**

- Enemy names: invent fitting English names (e.g. fierce combat-themed names matching the game's cultivation/xianxia setting)
- Descriptions: translate the text
- Add all new enemy name translations to the glossary

**Step 4: Run smoke test**

```bash
npm test
```

Expected: `1 passed`.

**Step 5: Update translation-plan.md** — change row 4 to `✅ Done`

**Step 6: Commit**

```bash
git add src/enemies.js docs/translation-glossary.md docs/translation-plan.md
git commit -m "translate: src/enemies.js (enemy names and descriptions)"
```

---

## Task 8: Translate src/locations.js

**Files:**
- Modify: `src/locations.js`
- Modify: `docs/translation-glossary.md`
- Modify: `docs/translation-plan.md`

**Step 1: Read src/locations.js in full**

**Step 2: Identify Chinese strings**

Locations likely have:
- `name:` — location display name
- `description:` — location lore text
- Enemy spawn references (string keys — do NOT translate)
- Any dialogue/hint text

**Step 3: Translate all user-visible strings inline**

Add all location names to the glossary.

**Step 4: Run smoke test**

```bash
npm test
```

Expected: `1 passed`.

**Step 5: Update translation-plan.md** — change row 5 to `✅ Done`

**Step 6: Commit**

```bash
git add src/locations.js docs/translation-glossary.md docs/translation-plan.md
git commit -m "translate: src/locations.js (location names and descriptions)"
```

---

## Task 9: Translate src/dialogues.js

**Files:**
- Modify: `src/dialogues.js`
- Modify: `docs/translation-plan.md`

**Step 1: Read src/dialogues.js in full**

**Step 2: Identify Chinese strings**

Dialogues contain:
- NPC names
- `starting_text` / `ending_text` default values (e.g. `与 ${name} 对话` → `Talk to ${name}`)
- Dialogue branch text and responses
- Any choice button labels

IMPORTANT: Template literals with `${...}` interpolation — translate the surrounding text, preserve the `${variable}` exactly as-is.

**Step 3: Translate all user-visible strings**

Example:
```js
// Before
starting_text = `与 ${name} 对话`
ending_text = `返回`

// After
starting_text = `Talk to ${name}`
ending_text = `Return`
```

**Step 4: Run smoke test**

```bash
npm test
```

Expected: `1 passed`.

**Step 5: Update translation-plan.md** — change row 6 to `✅ Done`

**Step 6: Commit**

```bash
git add src/dialogues.js docs/translation-plan.md
git commit -m "translate: src/dialogues.js (NPC dialogue text)"
```

---

## Task 10: Translate src/crafting_recipes.js

**Files:**
- Modify: `src/crafting_recipes.js`
- Modify: `docs/translation-plan.md`

**Step 1: Read src/crafting_recipes.js in full**

**Step 2: Identify Chinese strings**

Crafting recipes likely have:
- `name:` or recipe display name
- `description:` or result description
- Ingredient references (string keys — do NOT translate)
- Result item references (string keys — do NOT translate)

**Step 3: Translate all user-visible strings**

Use the glossary for all item/material names that already have established translations.

**Step 4: Run smoke test**

```bash
npm test
```

Expected: `1 passed`.

**Step 5: Update translation-plan.md** — change row 7 to `✅ Done`

**Step 6: Commit**

```bash
git add src/crafting_recipes.js docs/translation-plan.md
git commit -m "translate: src/crafting_recipes.js (recipe names and descriptions)"
```

---

## Task 11: Translate src/display.js

**Files:**
- Modify: `src/display.js`
- Modify: `docs/translation-plan.md`

**Step 1: Read src/display.js in full**

**Step 2: Identify Chinese strings**

`display.js` generates HTML dynamically. Chinese text likely appears as:
- String literals in template literals: `` `攻击力: ${value}` ``
- Static label strings passed to DOM manipulation
- Tooltip text
- UI section headers

**Step 3: Translate all user-visible strings**

Example:
```js
// Before
element.textContent = `攻击力: ${value}`;

// After
element.textContent = `ATK: ${value}`;
```

Preserve all `${...}` interpolations exactly.

**Step 4: Run smoke test**

```bash
npm test
```

Expected: `1 passed`.

**Step 5: Update translation-plan.md** — change row 8 to `✅ Done`

**Step 6: Commit**

```bash
git add src/display.js docs/translation-plan.md
git commit -m "translate: src/display.js (UI rendering strings)"
```

---

## Task 12: Translate src/skills.js

**Files:**
- Modify: `src/skills.js`
- Modify: `docs/translation-glossary.md`
- Modify: `docs/translation-plan.md`

**Step 1: Read src/skills.js in full**

**Step 2: Translate name: and description: fields for all skills**

Add all skill names to the glossary.

**Step 3: Run smoke test**

```bash
npm test
```

Expected: `1 passed`.

**Step 4: Update translation-plan.md** — change row 9 to `✅ Done`

**Step 5: Commit**

```bash
git add src/skills.js docs/translation-glossary.md docs/translation-plan.md
git commit -m "translate: src/skills.js (skill names and descriptions)"
```

---

## Task 13: Translate src/traders.js

**Files:**
- Modify: `src/traders.js`
- Modify: `docs/translation-plan.md`

**Step 1: Read src/traders.js in full**

**Step 2: Translate all user-visible strings**

Traders likely have names, shop descriptions, and dialogue text. Item name keys in trade lists — do NOT translate.

**Step 3: Run smoke test**

```bash
npm test
```

Expected: `1 passed`.

**Step 4: Update translation-plan.md** — change row 10 to `✅ Done`

**Step 5: Commit**

```bash
git add src/traders.js docs/translation-plan.md
git commit -m "translate: src/traders.js (trader names and shop text)"
```

---

## Task 14: Translate remaining small files

**Files:**
- Modify: `src/active_effects.js`
- Modify: `src/combat_stances.js`
- Modify: `src/character.js`
- Modify: `src/misc.js`
- Modify: `src/activities.js`
- Modify: `src/trade.js`
- Modify: `src/game_time.js`
- Modify: `docs/translation-plan.md`

**Step 1: Read each file**

Read all 7 files. Identify Chinese strings in each.

**Step 2: Translate all user-visible strings**

Apply the same rules: translate `name:`, `description:`, and display text. Do not translate code keys.

**Step 3: Run smoke test**

```bash
npm test
```

Expected: `1 passed`.

**Step 4: Update translation-plan.md** — mark rows 11–17 as `✅ Done`

**Step 5: Commit all at once**

```bash
git add src/active_effects.js src/combat_stances.js src/character.js src/misc.js src/activities.js src/trade.js src/game_time.js docs/translation-plan.md
git commit -m "translate: remaining small files (active_effects, stances, character, misc, activities, trade, game_time)"
```

---

## Task 15: Final verification

**Step 1: Run smoke test one final time**

```bash
npm test
```

Expected: `1 passed`.

**Step 2: Verify no Chinese remains in JS files**

Run this command to check for any remaining Chinese characters:

```bash
grep -rn --include="*.js" $'[\u4e00-\u9fff]' src/ main.js
```

Expected: no output (all Chinese translated).

```bash
grep -n $'[\u4e00-\u9fff]' index.html
```

Expected: no output.

**Step 3: If any Chinese strings remain**, translate them now following the same inline replacement rules, run the smoke test, and commit.

**Step 4: Final commit if any cleanup was needed**

```bash
git add -p
git commit -m "translate: fix remaining untranslated strings"
```

**Step 5: Confirm translation-plan.md shows all rows as ✅ Done**
