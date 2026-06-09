# Translation Progress

See also: [Glossary](translation-glossary.md)

## Files

| # | File | Est. Strings | Status |
|---|------|-------------|--------|
| 1 | `main.js` (root) | ~293 | ✅ Done |
| 2 | `index.html` | ~104 | ✅ Done |
| 3 | `src/items.js` | ~562 | ✅ Done |
| 4 | `src/enemies.js` | ~788 | ✅ Done |
| 5 | `src/locations.js` | ~764 | ✅ Done |
| 6 | `src/dialogues.js` | ~265 | ✅ Done |
| 7 | `src/crafting_recipes.js` | ~292 | ✅ Done |
| 8 | `src/display.js` | ~284 | ✅ Done |
| 9 | `src/skills.js` | ~135 | ✅ Done |
| 10 | `src/traders.js` | ~121 | ✅ Done |
| 11 | `src/active_effects.js` | ~48 | ✅ Done |
| 12 | `src/combat_stances.js` | ~20 | ✅ Done |
| 13 | `src/character.js` | ~18 | ✅ Done |
| 14 | `src/misc.js` | ~10 | ✅ Done |
| 15 | `src/activities.js` | ~8 | ✅ Done |
| 16 | `src/trade.js` | ~1 | ✅ Done |
| 17 | `src/game_time.js` | ~3 | ✅ Done |

## Translation Rules

1. Always check the glossary before translating a term
2. Translate display strings only — not internal code keys/identifiers
3. Preserve all JS syntax exactly (no added/removed brackets, commas, etc.)
4. Item/enemy names used as lookup keys stay in Chinese — only the `name:` display field is translated
5. Run `npm test` after each file commit

## Remaining Chinese (Intentional)

The following Chinese remains in the codebase by design — these are **internal cross-reference keys**, not user-visible text:

- `item_templates["铁锭"]` style dict keys in `items.js`, `crafting_recipes.js`, `traders.js`, `locations.js`, `main.js`
- `enemy_templates["纳家待从"]` style keys in `enemies.js`, `locations.js`, `main.js`
- `locations["荒兽森林-1"]` style keys in `locations.js`, `display.js`, `main.js`
- `dialogues["猫妖"]` and textline choice keys in `dialogues.js`
- Switch-case realm-parsing characters in `main.js` (e.g. `case "微":`)
- Inventory JSON key strings (e.g. `{"id":"纳娜米"}`) in `main.js`
- Developer comments throughout all files
