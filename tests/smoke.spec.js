import { test, expect } from '@playwright/test';

test('game loads without JS errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Ignore browser autoplay policy errors (not game bugs)
  const isAutoplayError = (msg) => msg.includes('play method is not allowed') || msg.includes('autoplay');


  await page.goto('/');

  // Wait for loading screen to disappear (game has finished initializing)
  await expect(page.locator('#loading_screen')).toBeHidden({ timeout: 10000 });

  // Assert key structural elements exist and are visible
  await expect(page.locator('#main_content')).toBeVisible();
  await expect(page.locator('#basic_character_info_div')).toBeVisible();
  await expect(page.locator('#inventory_div')).toBeVisible();
  // #combat_div is only visible during active combat, so we just assert it exists in the DOM
  await expect(page.locator('#combat_div')).toBeAttached();

  // Assert zero JS errors (excluding browser autoplay policy noise)
  const realErrors = errors.filter(e => !isAutoplayError(e));
  expect(realErrors, `JS errors found: ${realErrors.join('\n')}`).toHaveLength(0);
});
