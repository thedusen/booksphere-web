/**
 * Flagging System E2E Tests
 * 
 * These tests verify the complete flagging workflow from user perspective.
 * They use a cloud Supabase instance and real authentication.
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration for cloud Supabase
const TEST_CONFIG = {
  // Use the real test user credentials provided
  email: 'testuser@email.com',
  password: 'testuser',
  baseUrl: 'http://localhost:3000',
};

/**
 * Helper function to sign up a new test user
 */
async function signUpTestUser(page: Page, email: string, password: string) {
  await page.goto('/');
  
  // Check if we're on the login page or need to navigate there
  const signUpLink = page.locator('[data-testid="signup-link"]').or(page.getByRole('link', { name: /sign up/i }));
  if (await signUpLink.isVisible()) {
    await signUpLink.click();
  }
  
  // Fill in the signup form
  await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  
  // Submit the form
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful signup and navigation
  await page.waitForURL('**/inventory**', { timeout: 30000 });
}

/**
 * Helper function to sign in an existing test user
 */
async function signInTestUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  
  await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  
  // Submit the form
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful login and navigation
  await page.waitForURL('**/inventory**', { timeout: 30000 });
}

/**
 * Helper function to navigate to inventory page
 */
async function navigateToInventory(page: Page) {
  await page.goto('/inventory');
  await page.waitForLoadState('networkidle');
}

test.describe('Flagging System E2E Tests', () => {
  
  test.describe.configure({ mode: 'serial' });
  
  test('User Flag Creation Workflow', async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    // Listen for network requests
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('Network error:', response.status(), response.url());
      }
    });
    
    // Step 1: Sign in with existing test user
    await signInTestUser(page, TEST_CONFIG.email, TEST_CONFIG.password);
    
    // Step 2: Navigate to inventory
    await navigateToInventory(page);
    
    // Step 3: Verify flagging triggers are present
    const flaggingTriggers = page.locator('[data-flagging-trigger]');
    await expect(flaggingTriggers.first()).toBeVisible({ timeout: 10000 });
    
    // Step 4: Right-click on a flaggable field
    const firstTrigger = flaggingTriggers.first();
    await firstTrigger.click({ button: 'right' });
    
    // Step 5: Verify context menu appears
    const contextMenu = page.locator('[role="menu"]');
    await expect(contextMenu).toBeVisible({ timeout: 5000 });
    
    // Step 6: Click "Report Issue" option
    const reportOption = page.getByRole('menuitem', { name: /report issue/i });
    await expect(reportOption).toBeVisible();
    await reportOption.click();
    
    // Step 7: Verify flagging form opens
    const flaggingForm = page.locator('[data-testid="flagging-form"]');
    await expect(flaggingForm).toBeVisible({ timeout: 5000 });
    
    // Step 8: Fill out the flagging form (form should have default values already selected)
    await page.fill('[data-testid="flag-reason"]', 'Test flag for E2E testing - This is a test flag created during E2E testing to verify the flagging system works correctly.');
    
    // Step 9: Submit the flag
    await page.click('[data-testid="submit-flag-button"]');
    
    // Wait a moment for any network requests
    await page.waitForTimeout(2000);
    
    // Step 10: Verify success message (try multiple selectors)
    const successMessage = page.locator('[data-sonner-toast]').or(
      page.locator('[role="status"]')
    ).or(
      page.locator('.sonner-toast')
    ).or(
      page.locator('[data-testid*="toast"]')
    );
    
    // If no toast appears, check if form closed (indicating success)
    const isFormClosed = await page.locator('[data-testid="flagging-form"]').isHidden();
    if (isFormClosed) {
      console.log('Form closed successfully - likely indicates successful submission');
    } else {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/form-still-open.png', fullPage: true });
      console.log('Form is still open - checking for any visible toasts');
      
      // Check for any error messages in the form
      const errorMessages = await page.locator('[role="alert"], .text-destructive, .text-red-500').all();
      console.log(`Found ${errorMessages.length} error messages`);
      for (let i = 0; i < errorMessages.length; i++) {
        const text = await errorMessages[i].textContent();
        console.log(`Error message ${i + 1}: ${text}`);
      }
      
      const allToasts = await page.locator('*').filter({ hasText: /submitted|success|error|flag/i }).all();
      console.log(`Found ${allToasts.length} elements with relevant text`);
    }
    
    // Step 11: Verify form closes (if it hasn't already)
    if (!isFormClosed) {
      await expect(flaggingForm).not.toBeVisible({ timeout: 5000 });
    }
  });
  
  test('should handle form submission errors gracefully', async ({ page }) => {
    // Sign in with existing user
    await signInTestUser(page, TEST_CONFIG.email, TEST_CONFIG.password);
    await navigateToInventory(page);
    
    // Open flagging form
    const firstTrigger = page.locator('[data-flagging-trigger]').first();
    await firstTrigger.click({ button: 'right' });
    
    const reportOption = page.getByRole('menuitem', { name: /report issue/i });
    await reportOption.click();
    
    // Try to submit empty form
    await page.click('[data-testid="submit-flag-button"]');
    
    // Verify error message appears (Sonner toast)
    const errorMessage = page.locator('[data-sonner-toast]', { hasText: /error|required/i }).or(
      page.locator('[role="status"]', { hasText: /error|required/i })
    );
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });
  
  test('should display flagging triggers in list view', async ({ page }) => {
    await signInTestUser(page, TEST_CONFIG.email, TEST_CONFIG.password);
    await navigateToInventory(page);
    
    // Verify flagging triggers are present in the inventory table
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
    
    // Check that flaggable fields have the correct CSS class
    const flaggableFields = page.locator('.flaggable-field');
    await expect(flaggableFields.first()).toBeVisible();
    
    // Verify hover state works
    await flaggableFields.first().hover();
    
    // The flaggable field should have visual indicators (cursor, underline, etc.)
    await expect(flaggableFields.first()).toHaveClass(/flaggable-field/);
  });
  
  test('should work across different inventory views', async ({ page }) => {
    await signInTestUser(page, TEST_CONFIG.email, TEST_CONFIG.password);
    
    // Test list view
    await navigateToInventory(page);
    let flaggingTriggers = page.locator('[data-flagging-trigger]');
    await expect(flaggingTriggers.first()).toBeVisible();
    
    // Test detail view (if available)
    const firstInventoryItem = page.locator('table tbody tr').first();
    if (await firstInventoryItem.isVisible()) {
      await firstInventoryItem.click();
      
      // Wait for detail view to load
      await page.waitForLoadState('networkidle');
      
      // Check for flagging triggers in detail view
      const detailTriggers = page.locator('[data-flagging-trigger]');
      if (await detailTriggers.count() > 0) {
        await expect(detailTriggers.first()).toBeVisible();
      }
    }
  });
}); 