import { test, expect } from '@playwright/test';

test('debug errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
  });
  await page.goto('/');
  await page.waitForTimeout(12000);
  console.log('ALL ERRORS:\n' + errors.join('\n'));
  expect(1).toBe(1);
});
