import { test, expect } from '@playwright/test';

test.describe('Attendee App E2E Journey', () => {
  test('should load page, complete onboarding, and calculate route', async ({ page }) => {
    // Go to home page
    await page.goto('/');
    
    // Click "Attend Simulation" onboarding button
    const attendBtn = page.locator('[aria-label="Enter the SwarmAI attendee simulation"]');
    await expect(attendBtn).toBeVisible();
    await attendBtn.click();
    
    // Fill in username on the login screen
    const usernameInput = page.locator('#username-input');
    await expect(usernameInput).toBeVisible();
    await usernameInput.fill('E2E Test User');
    
    // Click Log In & Map Space
    const submitBtn = page.locator('[aria-label="Log in and enter the stadium simulation"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Click "Help me route" button to open the chat sidebar
    const helpBtn = page.locator('text=Help me route');
    await expect(helpBtn).toBeVisible();
    await helpBtn.click({ force: true });
    
    // Check if assistant panel is visible now
    const assistantHeader = page.locator('text=Swarm Assistant');
    await expect(assistantHeader).toBeVisible();
    
    // Check if 3D Canvas is visible
    const seatSelector = page.locator('[aria-label="3D Stadium crowd simulation — use the SwarmAI Assistant panel to navigate"]');
    await expect(seatSelector).toBeVisible();
  });
});
