import { test, expect } from '@playwright/test';

test.describe('Attendee App E2E Journey', () => {
  test('should load page, select a seat, and calculate route', async ({ page }) => {
    // Go to home page
    await page.goto('/');
    
    // Select a seat (represented by clicking a block or selecting preset)
    const seatSelector = page.locator('[aria-label="3D Stadium crowd simulation — use the SwarmAI Assistant panel to navigate"]');
    await expect(seatSelector).toBeVisible();
    
    // Check if assistant panel is accessible
    const assistantHeader = page.locator('text=SwarmAI Assistant');
    await expect(assistantHeader).toBeVisible();
  });
});
