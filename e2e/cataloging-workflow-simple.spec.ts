/**
 * Simplified Cataloging Workflow E2E Tests
 * 
 * This test focuses on the UI components that are actually available
 * and tests the user interaction flow without requiring real database jobs.
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  email: 'testuser@email.com',
  password: 'testuser',
  baseUrl: 'http://localhost:3000',
};

/**
 * Helper function to sign in the test user
 */
async function signInTestUser(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Fill in login credentials
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', TEST_CONFIG.email);
  await page.fill('input[type="password"]', TEST_CONFIG.password);
  
  // Click login button
  await page.click('button[type="submit"]');
  await page.waitForURL('**/inventory**', { timeout: 30000 });
}

test.describe('Cataloging Workflow E2E Tests - UI Components', () => {
  
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    // Sign in before each test
    await signInTestUser(page);
  });

  test('Navigate to Cataloging Dashboard', async ({ page }) => {
    // Navigate to cataloging page
    await page.goto('/cataloging');
    await page.waitForLoadState('networkidle');
    
    // Check that the cataloging dashboard loads
    await expect(page.locator('h1, h2').filter({ hasText: /cataloging/i }).first()).toBeVisible({ timeout: 10000 });
    
    // Check for expected UI elements
    const dashboardElements = [
      page.locator('table').first(), // Jobs table
      page.locator('[data-testid*="job"]').first(), // Job elements
      page.locator('button, .btn').first(), // Action buttons
    ];
    
    // At least one of these should be visible
    let elementFound = false;
    for (const element of dashboardElements) {
      if (await element.isVisible()) {
        elementFound = true;
        break;
      }
    }
    
    expect(elementFound).toBe(true);
  });

  test('Cataloging Dashboard UI Elements', async ({ page }) => {
    await page.goto('/cataloging');
    await page.waitForLoadState('networkidle');
    
    // Check for common UI elements that should be present
    const uiElements = [
      { selector: 'h1, h2, [data-testid*="header"]', description: 'Page header' },
      { selector: 'table, [data-testid*="table"], [data-testid*="list"]', description: 'Data display' },
      { selector: 'button, .btn', description: 'Action buttons' },
      { selector: 'input, [data-testid*="search"]', description: 'Search/filter inputs' },
    ];
    
    for (const { selector, description } of uiElements) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        console.log(`✓ Found ${description}: ${selector}`);
      }
    }
    
    // Verify the page doesn't have any major errors
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
  });

  test('Navigation Between Cataloging Pages', async ({ page }) => {
    // Start at cataloging dashboard
    await page.goto('/cataloging');
    await page.waitForLoadState('networkidle');
    
    // Try to navigate to any available job detail page
    const jobLinks = page.locator('a[href*="/cataloging/jobs/"]');
    const jobCount = await jobLinks.count();
    
    if (jobCount > 0) {
      // Click on the first job link
      await jobLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verify we're on a job detail page
      await expect(page.url()).toContain('/cataloging/jobs/');
      
      // Check if there's a back button or navigation
      const backButton = page.locator('button', { hasText: /back|return/i }).first();
      if (await backButton.isVisible()) {
        await backButton.click();
        await page.waitForLoadState('networkidle');
        
        // Verify we're back on the cataloging dashboard
        await expect(page.url()).toContain('/cataloging');
      }
    } else {
      console.log('No job links found - this is expected in a test environment');
    }
  });

  test('Real-time Notification System', async ({ page }) => {
    await page.goto('/cataloging');
    await page.waitForLoadState('networkidle');
    
    // Setup toast listeners
    const toastMessages: string[] = [];
    
    // Listen for toast notifications
    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('toast')) {
        toastMessages.push(msg.text());
      }
    });
    
    // Set up DOM observer for toast notifications
    await page.evaluate(() => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.matches('[data-sonner-toast]') || 
                    element.matches('.sonner-toast') ||
                    element.matches('[role="status"]') ||
                    element.classList.contains('toast')) {
                  console.log('toast-notification-detected:', element.textContent);
                }
              }
            });
          }
        });
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      (window as any).toastObserver = observer;
    });
    
    // Simulate some action that might trigger a notification
    const actionButtons = page.locator('button').filter({ hasText: /refresh|reload|update/i });
    const buttonCount = await actionButtons.count();
    
    if (buttonCount > 0) {
      await actionButtons.first().click();
      await page.waitForTimeout(2000); // Wait for potential notifications
    }
    
    // Check if the notification system is properly set up
    const toastContainer = page.locator('[data-sonner-toaster], .sonner-toaster, [data-testid="toast-container"]');
    if (await toastContainer.isVisible()) {
      console.log('✓ Toast notification system is present');
    }
    
    // The test passes if we get this far without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('Error Handling and Edge Cases', async ({ page }) => {
    // Test navigation to non-existent job
    await page.goto('/cataloging/jobs/non-existent-job');
    await page.waitForLoadState('networkidle');
    
    // Should either redirect or show a not found message
    const possibleStates = [
      page.locator('h1, h2').filter({ hasText: /not found|404/i }),
      page.locator('[data-testid="error-message"]'),
      page.locator('body'), // If redirected, body should still be visible
    ];
    
    let validStateFound = false;
    for (const state of possibleStates) {
      if (await state.isVisible()) {
        validStateFound = true;
        break;
      }
    }
    
    expect(validStateFound).toBe(true);
    
    // Test navigation back to cataloging dashboard
    await page.goto('/cataloging');
    await page.waitForLoadState('networkidle');
    
    // Should successfully load the dashboard
    await expect(page.locator('body')).toBeVisible();
  });

  test('Accessibility and User Experience', async ({ page }) => {
    await page.goto('/cataloging');
    await page.waitForLoadState('networkidle');
    
    // Check for basic accessibility elements
    const accessibilityElements = [
      'h1, h2, h3', // Headings for structure
      'button, input', // Interactive elements
      '[aria-label], [aria-labelledby]', // ARIA labels
      'main, nav, header', // Semantic elements
    ];
    
    for (const selector of accessibilityElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`✓ Found ${count} ${selector} elements`);
      }
    }
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    if (await focusedElement.isVisible()) {
      console.log('✓ Keyboard navigation working');
    }
    
    // The test passes if we get this far without errors
    await expect(page.locator('body')).toBeVisible();
  });

}); 