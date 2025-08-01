/**
 * Comprehensive Cataloging Workflow E2E Tests
 * 
 * Tests cover:
 * 1. Complete scan → review → finalize workflow
 * 2. Dashboard bulk operations (delete, retry)
 * 3. Error handling and recovery scenarios
 * 4. Real-time notifications and updates
 * 5. Multi-user concurrent operations
 * 6. Performance under load
 * 7. Mobile responsiveness
 * 8. Accessibility compliance
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  email: 'testuser@email.com',
  password: 'testuser',
  baseUrl: 'http://localhost:3000',
  timeout: {
    long: 30000,
    medium: 15000,
    short: 5000,
  },
  mockBookData: {
    title: 'The Complete Guide to E2E Testing',
    subtitle: 'A Comprehensive Manual for Modern Web Applications',
    authors: ['Jane Doe', 'John Smith'],
    publisher_name: 'Testing Publications',
    publication_year: 2024,
    isbn: '9781234567890',
    price: 49.99,
    condition_notes: 'Excellent condition, minor shelf wear',
    sku: 'E2E-TEST-COMPREHENSIVE-001',
    format: 'Hardcover',
  },
  performanceThresholds: {
    pageLoad: 3000,
    navigation: 1000,
    apiResponse: 2000,
  },
};

/**
 * Enhanced authentication helper with session management
 */
async function authenticateUser(page: Page): Promise<void> {
  await page.goto('/login');
  
  await page.waitForSelector('[data-testid="email-input"]', { 
    timeout: TEST_CONFIG.timeout.medium 
  });
  
  await page.fill('[data-testid="email-input"]', TEST_CONFIG.email);
  await page.fill('[data-testid="password-input"]', TEST_CONFIG.password);
  
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful authentication
  await page.waitForURL('**/inventory**', { 
    timeout: TEST_CONFIG.timeout.long 
  });
  
  // Verify user is authenticated
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
}

/**
 * Create a cataloging job for testing
 */
async function createTestCatalogingJob(page: Page): Promise<string> {
  await page.goto('/cataloging');
  await page.waitForLoadState('networkidle');
  
  // Use the test utilities page to create a job
  await page.goto('/test-link');
  await page.waitForLoadState('networkidle');
  
  // Create a test job using the mock API
  const jobId = await page.evaluate(async () => {
    const response = await fetch('/api/test-cataloging-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Test Book',
        source_type: 'mobile_upload',
        image_urls: {
          cover_url: 'https://example.com/test-cover.jpg',
          title_page_url: 'https://example.com/test-title.jpg',
          copyright_page_url: 'https://example.com/test-copyright.jpg',
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create test job: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.job_id;
  });
  
  return jobId;
}

/**
 * Wait for job to complete processing
 */
async function waitForJobCompletion(page: Page, jobId: string): Promise<void> {
  await page.goto('/cataloging');
  
  const maxAttempts = 30; // 30 seconds max wait
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Look for the job in the dashboard
    const jobRow = page.locator(`[data-testid="job-row-${jobId}"]`).or(
      page.locator('table tbody tr').filter({ hasText: jobId })
    );
    
    if (await jobRow.isVisible()) {
      const statusBadge = jobRow.locator('[data-testid="job-status"]').or(
        jobRow.locator('.status-badge, .badge')
      );
      
      if (await statusBadge.isVisible()) {
        const statusText = await statusBadge.textContent();
        
        if (statusText?.toLowerCase().includes('completed') || 
            statusText?.toLowerCase().includes('ready')) {
          return;
        }
        
        if (statusText?.toLowerCase().includes('failed') || 
            statusText?.toLowerCase().includes('error')) {
          throw new Error(`Job ${jobId} failed during processing`);
        }
      }
    }
    
    await page.waitForTimeout(1000);
    attempts++;
  }
  
  throw new Error(`Job ${jobId} did not complete within ${maxAttempts} seconds`);
}

/**
 * Fill out the review wizard form step by step
 */
async function completeReviewWizard(page: Page, bookData = TEST_CONFIG.mockBookData): Promise<void> {
  // Wait for review wizard to load
  await page.waitForSelector('[data-testid="review-wizard"]', { 
    timeout: TEST_CONFIG.timeout.medium 
  });
  
  // Step 1: Bibliographic Data
  await page.fill('[data-testid="title-input"]', bookData.title);
  await page.fill('[data-testid="subtitle-input"]', bookData.subtitle);
  
  // Handle authors
  for (let i = 0; i < bookData.authors.length; i++) {
    if (i > 0) {
      await page.click('[data-testid="add-author-button"]');
    }
    await page.fill(`[data-testid="author-input-${i}"]`, bookData.authors[i]);
  }
  
  await page.fill('[data-testid="publisher-input"]', bookData.publisher_name);
  await page.fill('[data-testid="publication-year-input"]', bookData.publication_year.toString());
  await page.fill('[data-testid="isbn-input"]', bookData.isbn);
  
  // Navigate to Step 2
  await page.click('[data-testid="next-step-button"]');
  await page.waitForSelector('[data-testid="format-select"]');
  
  // Step 2: Physical Details
  await page.click('[data-testid="format-select"]');
  await page.click(`text=${bookData.format}`);
  
  // Navigate to Step 3
  await page.click('[data-testid="next-step-button"]');
  await page.waitForSelector('[data-testid="price-input"]');
  
  // Step 3: Pricing and Final Review
  await page.fill('[data-testid="price-input"]', bookData.price.toString());
  await page.fill('[data-testid="sku-input"]', bookData.sku);
  await page.fill('[data-testid="condition-notes-input"]', bookData.condition_notes);
}

test.describe('Complete Cataloging Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test('should complete full scan → review → finalize workflow', async ({ page }) => {
    // Create a test cataloging job
    const jobId = await createTestCatalogingJob(page);
    
    // Wait for job processing to complete
    await waitForJobCompletion(page, jobId);
    
    // Navigate to cataloging dashboard
    await page.goto('/cataloging');
    await page.waitForLoadState('networkidle');
    
    // Find and click the completed job
    const jobRow = page.locator(`[data-testid="job-row-${jobId}"]`).or(
      page.locator('table tbody tr').filter({ hasText: jobId })
    );
    
    await expect(jobRow).toBeVisible({ timeout: TEST_CONFIG.timeout.medium });
    await jobRow.click();
    
    // Click review button
    const reviewButton = page.locator('[data-testid="review-job-button"]').or(
      page.locator('button', { hasText: /review|finalize/i })
    );
    
    await expect(reviewButton).toBeVisible();
    await reviewButton.click();
    
    // Complete the review wizard
    await completeReviewWizard(page);
    
    // Submit the form
    const finalizeButton = page.locator('[data-testid="finalize-button"]').or(
      page.locator('button', { hasText: /finalize|add to inventory/i })
    );
    
    await expect(finalizeButton).toBeVisible();
    await finalizeButton.click();
    
    // Wait for success notification
    await expect(page.locator('.toast, [data-testid="success-toast"]')).toContainText(
      /successfully added|added to inventory/i,
      { timeout: TEST_CONFIG.timeout.medium }
    );
    
    // Verify navigation back to cataloging dashboard
    await expect(page).toHaveURL(/.*\/cataloging.*/);
    
    // Verify job is no longer in pending/review state
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const completedJobRow = page.locator(`[data-testid="job-row-${jobId}"]`);
    if (await completedJobRow.isVisible()) {
      const statusBadge = completedJobRow.locator('[data-testid="job-status"]');
      const statusText = await statusBadge.textContent();
      expect(statusText).not.toMatch(/pending|review|processing/i);
    }
  });

  test('should handle edition matching during review', async ({ page }) => {
    const jobId = await createTestCatalogingJob(page);
    await waitForJobCompletion(page, jobId);
    
    await page.goto(`/cataloging/jobs/${jobId}/review`);
    await page.waitForSelector('[data-testid="review-wizard"]');
    
    // Enter a title that should trigger edition matching
    await page.fill('[data-testid="title-input"]', 'Harry Potter and the Philosopher\'s Stone');
    
    // Wait for edition matching dialog
    await expect(page.locator('[data-testid="edition-match-dialog"]')).toBeVisible({
      timeout: TEST_CONFIG.timeout.medium
    });
    
    // Check for matches
    const matchItems = page.locator('[data-testid="edition-match-item"]');
    if (await matchItems.count() > 0) {
      // Select the first match
      await matchItems.first().click();
      
      // Verify form is populated with match data
      const titleInput = page.locator('[data-testid="title-input"]');
      await expect(titleInput).toHaveValue(/Harry Potter/i);
    } else {
      // Create new edition
      await page.click('[data-testid="create-new-button"]');
    }
    
    // Continue with wizard
    await page.click('[data-testid="next-step-button"]');
    await expect(page.locator('[data-testid="format-select"]')).toBeVisible();
  });

  test('should validate required fields in review wizard', async ({ page }) => {
    const jobId = await createTestCatalogingJob(page);
    await waitForJobCompletion(page, jobId);
    
    await page.goto(`/cataloging/jobs/${jobId}/review`);
    await page.waitForSelector('[data-testid="review-wizard"]');
    
    // Clear required title field
    await page.fill('[data-testid="title-input"]', '');
    
    // Navigate to final step
    await page.click('[data-testid="next-step-button"]'); // Step 2
    await page.click('[data-testid="next-step-button"]'); // Step 3
    
    // Try to submit without required fields
    const finalizeButton = page.locator('[data-testid="finalize-button"]');
    await finalizeButton.click();
    
    // Should show validation error
    await expect(page.locator('.toast, [data-testid="error-toast"]')).toContainText(
      /required fields|please fill/i,
      { timeout: TEST_CONFIG.timeout.short }
    );
    
    // Should not navigate away
    await expect(page.locator('[data-testid="review-wizard"]')).toBeVisible();
  });
});

test.describe('Dashboard Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test('should perform bulk delete operations', async ({ page }) => {
    // Create multiple test jobs
    const jobIds = [];
    for (let i = 0; i < 3; i++) {
      const jobId = await createTestCatalogingJob(page);
      jobIds.push(jobId);
    }
    
    await page.goto('/cataloging');
    await page.waitForLoadState('networkidle');
    
    // Select multiple jobs using checkboxes
    for (const jobId of jobIds) {
      const checkbox = page.locator(`[data-testid="select-job-${jobId}"]`).or(
        page.locator(`tr:has-text("${jobId}") input[type="checkbox"]`)
      );
      
      if (await checkbox.isVisible()) {
        await checkbox.check();
      }
    }
    
    // Click bulk delete button
    const deleteButton = page.locator('[data-testid="bulk-delete-button"]').or(
      page.locator('button', { hasText: /delete selected/i })
    );
    
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
    
    // Confirm deletion in dialog
    const confirmButton = page.locator('[data-testid="confirm-delete-button"]').or(
      page.locator('button', { hasText: /confirm|delete/i })
    );
    
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
    
    // Wait for success notification
    await expect(page.locator('.toast')).toContainText(
      /deleted successfully|removed/i,
      { timeout: TEST_CONFIG.timeout.medium }
    );
    
    // Verify jobs are removed from the list
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    for (const jobId of jobIds) {
      const jobRow = page.locator(`[data-testid="job-row-${jobId}"]`);
      await expect(jobRow).not.toBeVisible();
    }
  });

  test('should perform bulk retry operations', async ({ page }) => {
    // Create failed test jobs (would need API endpoint for this)
    const failedJobId = await page.evaluate(async () => {
      const response = await fetch('/api/test-cataloging-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Failed Test Job',
          status: 'failed',
          error_message: 'Test failure for retry scenario',
        }),
      });
      
      const data = await response.json();
      return data.job_id;
    });
    
    await page.goto('/cataloging');
    await page.waitForLoadState('networkidle');
    
    // Filter to show failed jobs
    const statusFilter = page.locator('[data-testid="status-filter"]');
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.click('text=Failed');
    }
    
    // Select failed job
    const failedJobCheckbox = page.locator(`[data-testid="select-job-${failedJobId}"]`);
    await expect(failedJobCheckbox).toBeVisible();
    await failedJobCheckbox.check();
    
    // Click bulk retry button
    const retryButton = page.locator('[data-testid="bulk-retry-button"]');
    await expect(retryButton).toBeVisible();
    await retryButton.click();
    
    // Wait for success notification
    await expect(page.locator('.toast')).toContainText(
      /retry initiated|processing/i,
      { timeout: TEST_CONFIG.timeout.medium }
    );
    
    // Verify job status updated
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const jobRow = page.locator(`[data-testid="job-row-${failedJobId}"]`);
    const statusBadge = jobRow.locator('[data-testid="job-status"]');
    await expect(statusBadge).not.toContainText(/failed/i);
  });

  test('should handle concurrent bulk operations gracefully', async ({ page, context }) => {
    // Create multiple test jobs
    const jobIds = [];
    for (let i = 0; i < 5; i++) {
      const jobId = await createTestCatalogingJob(page);
      jobIds.push(jobId);
    }
    
    // Open second tab to simulate concurrent user
    const page2 = await context.newPage();
    await authenticateUser(page2);
    
    await Promise.all([
      page.goto('/cataloging'),
      page2.goto('/cataloging'),
    ]);
    
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page2.waitForLoadState('networkidle'),
    ]);
    
    // Perform concurrent operations
    const operations = [
      // User 1: Delete first 3 jobs
      (async () => {
        for (let i = 0; i < 3; i++) {
          const checkbox = page.locator(`[data-testid="select-job-${jobIds[i]}"]`);
          if (await checkbox.isVisible()) {
            await checkbox.check();
          }
        }
        await page.click('[data-testid="bulk-delete-button"]');
        await page.click('[data-testid="confirm-delete-button"]');
      })(),
      
      // User 2: Try to delete last 2 jobs
      (async () => {
        await page2.waitForTimeout(500); // Small delay to create race condition
        for (let i = 3; i < 5; i++) {
          const checkbox = page2.locator(`[data-testid="select-job-${jobIds[i]}"]`);
          if (await checkbox.isVisible()) {
            await checkbox.check();
          }
        }
        await page2.click('[data-testid="bulk-delete-button"]');
        await page2.click('[data-testid="confirm-delete-button"]');
      })(),
    ];
    
    // Wait for both operations to complete
    await Promise.allSettled(operations);
    
    // Both users should see success notifications (or appropriate handling)
    await Promise.all([
      expect(page.locator('.toast')).toContainText(/success|deleted/i),
      expect(page2.locator('.toast')).toContainText(/success|deleted|already/i),
    ]);
    
    await page2.close();
  });
});

test.describe('Error Handling and Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/cataloging');
    
    // Simulate network failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    // Try to perform an action that requires network
    const refreshButton = page.locator('[data-testid="refresh-button"]');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
    }
    
    // Should show error message
    await expect(page.locator('.toast, [data-testid="error-message"]')).toContainText(
      /network error|connection failed|offline/i,
      { timeout: TEST_CONFIG.timeout.medium }
    );
    
    // Restore network and retry
    await page.unroute('**/api/**');
    
    const retryButton = page.locator('[data-testid="retry-button"]');
    if (await retryButton.isVisible()) {
      await retryButton.click();
    }
    
    // Should recover successfully
    await expect(page.locator('[data-testid="cataloging-dashboard"]')).toBeVisible();
  });

  test('should handle server errors with appropriate feedback', async ({ page }) => {
    await page.goto('/cataloging');
    
    // Mock server error
    await page.route('**/api/cataloging-jobs**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });
    
    await page.reload();
    
    // Should show error state
    await expect(page.locator('[data-testid="error-state"]')).toBeVisible({
      timeout: TEST_CONFIG.timeout.medium
    });
    
    // Should provide retry option
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should handle invalid job data gracefully', async ({ page }) => {
    // Create job with invalid/missing data
    const invalidJobId = await page.evaluate(async () => {
      const response = await fetch('/api/test-cataloging-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields intentionally
          title: '',
          extracted_data: null,
        }),
      });
      
      const data = await response.json();
      return data.job_id;
    });
    
    await page.goto(`/cataloging/jobs/${invalidJobId}/review`);
    
    // Should handle missing data gracefully
    await expect(page.locator('[data-testid="review-wizard"]')).toBeVisible();
    
    // Form should have empty but functional fields
    const titleInput = page.locator('[data-testid="title-input"]');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue('');
    
    // Should be able to enter data manually
    await page.fill('[data-testid="title-input"]', 'Manually Entered Title');
    await expect(titleInput).toHaveValue('Manually Entered Title');
  });
});

test.describe('Performance and Load Testing', () => {
  test('should handle large number of jobs efficiently', async ({ page }) => {
    await authenticateUser(page);
    
    // Create many test jobs (simulate existing load)
    const jobCreationPromises = [];
    for (let i = 0; i < 20; i++) {
      jobCreationPromises.push(createTestCatalogingJob(page));
    }
    
    const jobIds = await Promise.all(jobCreationPromises);
    
    // Measure dashboard load time
    const startTime = Date.now();
    await page.goto('/cataloging');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within performance threshold
    expect(loadTime).toBeLessThan(TEST_CONFIG.performanceThresholds.pageLoad);
    
    // Should display all jobs
    const jobRows = page.locator('[data-testid^="job-row-"]');
    const visibleJobs = await jobRows.count();
    expect(visibleJobs).toBeGreaterThan(10); // Should show at least 10 jobs per page
    
    // Test pagination performance if applicable
    const nextPageButton = page.locator('[data-testid="next-page-button"]');
    if (await nextPageButton.isVisible()) {
      const paginationStart = Date.now();
      await nextPageButton.click();
      await page.waitForLoadState('networkidle');
      const paginationTime = Date.now() - paginationStart;
      
      expect(paginationTime).toBeLessThan(TEST_CONFIG.performanceThresholds.navigation);
    }
  });

  test('should maintain responsiveness during bulk operations', async ({ page }) => {
    await authenticateUser(page);
    
    // Create test jobs for bulk operation
    const jobIds = [];
    for (let i = 0; i < 10; i++) {
      const jobId = await createTestCatalogingJob(page);
      jobIds.push(jobId);
    }
    
    await page.goto('/cataloging');
    await page.waitForLoadState('networkidle');
    
    // Select all jobs
    const selectAllCheckbox = page.locator('[data-testid="select-all-checkbox"]');
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.check();
    } else {
      // Manually select jobs
      for (const jobId of jobIds) {
        const checkbox = page.locator(`[data-testid="select-job-${jobId}"]`);
        if (await checkbox.isVisible()) {
          await checkbox.check();
        }
      }
    }
    
    // Measure bulk delete performance
    const operationStart = Date.now();
    await page.click('[data-testid="bulk-delete-button"]');
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Wait for operation to complete
    await expect(page.locator('.toast')).toContainText(/success/i, {
      timeout: TEST_CONFIG.timeout.long
    });
    
    const operationTime = Date.now() - operationStart;
    
    // Should complete within reasonable time
    expect(operationTime).toBeLessThan(10000); // 10 seconds max for bulk operation
    
    // UI should remain responsive
    await expect(page.locator('[data-testid="cataloging-dashboard"]')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should work correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await authenticateUser(page);
    const jobId = await createTestCatalogingJob(page);
    await waitForJobCompletion(page, jobId);
    
    await page.goto('/cataloging');
    await page.waitForLoadState('networkidle');
    
    // Should show mobile-optimized layout
    const mobileLayout = page.locator('[data-testid="mobile-job-cards"]').or(
      page.locator('.mobile-layout, .card-layout')
    );
    
    // Either mobile layout exists or table is responsive
    const tableExists = await page.locator('table').isVisible();
    if (tableExists) {
      // Table should be horizontally scrollable
      const table = page.locator('table');
      await expect(table).toBeVisible();
    } else {
      await expect(mobileLayout).toBeVisible();
    }
    
    // Touch interactions should work
    const jobItem = page.locator(`[data-testid="job-row-${jobId}"]`).or(
      page.locator('.job-card').first()
    );
    
    await expect(jobItem).toBeVisible();
    await jobItem.tap();
    
    // Should navigate to job details or review
    await expect(page).toHaveURL(/.*\/(jobs|review).*/);
  });

  test('should handle touch gestures in review wizard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await authenticateUser(page);
    
    const jobId = await createTestCatalogingJob(page);
    await waitForJobCompletion(page, jobId);
    
    await page.goto(`/cataloging/jobs/${jobId}/review`);
    await page.waitForSelector('[data-testid="review-wizard"]');
    
    // Test touch input on form fields
    const titleInput = page.locator('[data-testid="title-input"]');
    await titleInput.tap();
    await titleInput.fill('Mobile Test Title');
    
    // Test step navigation with touch
    const nextButton = page.locator('[data-testid="next-step-button"]');
    await nextButton.tap();
    
    await expect(page.locator('[data-testid="format-select"]')).toBeVisible();
    
    // Test select dropdown on mobile
    const formatSelect = page.locator('[data-testid="format-select"]');
    await formatSelect.tap();
    
    // Should show mobile-friendly dropdown or picker
    const formatOptions = page.locator('[role="option"], .select-option');
    await expect(formatOptions.first()).toBeVisible();
  });
});

test.describe('Accessibility Compliance', () => {
  test('should be fully keyboard navigable', async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/cataloging');
    
    // Test keyboard navigation through main dashboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test Enter key activation
    await page.keyboard.press('Enter');
    
    // Should activate the focused element
    // (This depends on what element is focused)
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await authenticateUser(page);
    const jobId = await createTestCatalogingJob(page);
    await waitForJobCompletion(page, jobId);
    
    await page.goto(`/cataloging/jobs/${jobId}/review`);
    await page.waitForSelector('[data-testid="review-wizard"]');
    
    // Check form accessibility
    const titleInput = page.locator('[data-testid="title-input"]');
    await expect(titleInput).toHaveAttribute('aria-label');
    
    const requiredFields = page.locator('input[required]');
    const requiredCount = await requiredFields.count();
    
    for (let i = 0; i < requiredCount; i++) {
      const field = requiredFields.nth(i);
      // Required fields should have aria-required or aria-label indicating requirement
      const hasAriaRequired = await field.getAttribute('aria-required');
      const hasRequiredLabel = await field.getAttribute('aria-label');
      
      expect(hasAriaRequired === 'true' || hasRequiredLabel?.includes('required')).toBeTruthy();
    }
    
    // Check button accessibility
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasText = await button.textContent();
      
      // Buttons should have either text content or aria-label
      expect(hasAriaLabel || hasText?.trim()).toBeTruthy();
    }
  });

  test('should work with screen readers', async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/cataloging');
    
    // Check for semantic landmarks
    await expect(page.locator('main, [role="main"]')).toBeVisible();
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    
    // Check for heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    // Should have proper heading structure
    expect(headingCount).toBeGreaterThan(1);
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const hasAlt = await img.getAttribute('alt');
      
      // Decorative images should have empty alt, content images should have descriptive alt
      expect(hasAlt !== null).toBeTruthy();
    }
  });
}); 