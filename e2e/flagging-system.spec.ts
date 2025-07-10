/**
 * End-to-End tests for the Flagging System
 * 
 * Tests cover the complete user workflow:
 * 1. User flags data via context menu
 * 2. User flags data via button
 * 3. Admin reviews and resolves flags
 * 4. Error handling and edge cases
 * 5. Accessibility compliance
 * 6. Keyboard navigation
 */

import { test, expect, Page } from '@playwright/test'

// Test data
const TEST_BOOK = {
  id: 'test-book-id-e2e',
  title: 'The Great Gatsby E2E Test',
  author: 'F. Scott Fitzgerald',
  isbn: '978-0-7432-7356-5',
  price: 15.99,
}

const TEST_FLAG = {
  type: 'incorrect_data',
  severity: 'medium',
  description: 'The publication year is incorrect. Should be 1925, not 1924.',
  suggestedValue: '1925',
}

// Helper functions
async function loginAsUser(page: Page) {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', 'user@test.com')
  await page.fill('[data-testid="password-input"]', 'password123')
  await page.click('[data-testid="login-button"]')
  await page.waitForURL('/dashboard')
}

async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', 'admin@test.com')
  await page.fill('[data-testid="password-input"]', 'admin123')
  await page.click('[data-testid="login-button"]')
  await page.waitForURL('/dashboard')
}

async function navigateToInventory(page: Page) {
  await page.click('[data-testid="inventory-nav-link"]')
  await page.waitForURL('/inventory')
}

async function createTestFlag(page: Page, flagData = TEST_FLAG) {
  // Right-click on a book title to open context menu
  await page.click('[data-testid="book-title"]', { button: 'right' })
  
  // Click "Report Issue" from context menu
  await page.click('[data-testid="flag-context-menu-item"]')
  
  // Wait for flag form to open
  await page.waitForSelector('[data-testid="flagging-form"]')
  
  // Fill out the form
  await page.selectOption('[data-testid="flag-type-select"]', flagData.type)
  await page.selectOption('[data-testid="severity-select"]', flagData.severity)
  await page.fill('[data-testid="description-textarea"]', flagData.description)
  await page.fill('[data-testid="suggested-value-input"]', flagData.suggestedValue)
  
  // Submit the form
  await page.click('[data-testid="submit-flag-button"]')
  
  // Wait for success message
  await page.waitForSelector('[data-testid="toast-success"]')
}

test.describe('Flagging System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Reset database state and create test data
    await page.request.post('/api/test/reset-database')
    await page.request.post('/api/test/seed-data', { data: { books: [TEST_BOOK] } })
  })

  test.describe('User Flag Creation Workflow', () => {
    test('should create a flag via context menu', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Verify book is displayed
      await expect(page.locator('[data-testid="book-title"]')).toContainText(TEST_BOOK.title)
      
      // Create flag via context menu
      await createTestFlag(page)
      
      // Verify flag was created successfully
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Flag Submitted')
      
      // Verify flag indicator appears on the book
      await expect(page.locator('[data-testid="flag-badge"]')).toBeVisible()
      await expect(page.locator('[data-testid="flag-badge"]')).toContainText('Flagged')
    })

    test('should create a flag via explicit button', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Click the flag button
      await page.click('[data-testid="flag-button"]')
      
      // Wait for flag form to open
      await page.waitForSelector('[data-testid="flagging-form"]')
      
      // Fill out the form
      await page.selectOption('[data-testid="flag-type-select"]', TEST_FLAG.type)
      await page.selectOption('[data-testid="severity-select"]', TEST_FLAG.severity)
      await page.fill('[data-testid="description-textarea"]', TEST_FLAG.description)
      
      // Submit the form
      await page.click('[data-testid="submit-flag-button"]')
      
      // Verify success
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Flag Submitted')
    })

    test('should show context preview in flag form', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Right-click on book title
      await page.click('[data-testid="book-title"]', { button: 'right' })
      await page.click('[data-testid="flag-context-menu-item"]')
      
      // Verify context preview is shown
      await expect(page.locator('[data-testid="context-preview"]')).toBeVisible()
      await expect(page.locator('[data-testid="context-book-title"]')).toContainText(TEST_BOOK.title)
      await expect(page.locator('[data-testid="context-author"]')).toContainText(TEST_BOOK.author)
      await expect(page.locator('[data-testid="context-isbn"]')).toContainText(TEST_BOOK.isbn)
    })

    test('should validate form inputs', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Open flag form
      await page.click('[data-testid="flag-button"]')
      await page.waitForSelector('[data-testid="flagging-form"]')
      
      // Try to submit without required fields
      await page.click('[data-testid="submit-flag-button"]')
      
      // Verify validation errors
      await expect(page.locator('[data-testid="flag-type-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="severity-error"]')).toBeVisible()
      
      // Fill required fields
      await page.selectOption('[data-testid="flag-type-select"]', 'incorrect_data')
      await page.selectOption('[data-testid="severity-select"]', 'medium')
      
      // Submit should now work
      await page.click('[data-testid="submit-flag-button"]')
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    })

    test('should handle form submission errors gracefully', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Mock API failure
      await page.route('/api/flags', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        })
      })
      
      // Try to create flag
      await page.click('[data-testid="flag-button"]')
      await page.waitForSelector('[data-testid="flagging-form"]')
      
      await page.selectOption('[data-testid="flag-type-select"]', 'incorrect_data')
      await page.selectOption('[data-testid="severity-select"]', 'medium')
      await page.fill('[data-testid="description-textarea"]', 'Test description')
      
      await page.click('[data-testid="submit-flag-button"]')
      
      // Verify error handling
      await expect(page.locator('[data-testid="toast-error"]')).toContainText('Submission Error')
      
      // Form should remain open for retry
      await expect(page.locator('[data-testid="flagging-form"]')).toBeVisible()
    })
  })

  test.describe('Flag Status and UI States', () => {
    test('should show different flag statuses correctly', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Create a flag first
      await createTestFlag(page)
      
      // Verify "open" status
      await expect(page.locator('[data-testid="flag-badge"]')).toContainText('Flagged')
      
      // Simulate status change to "in_review" (via admin action)
      await page.request.patch(`/api/flags/${TEST_BOOK.id}`, {
        data: { status: 'in_review' }
      })
      
      // Refresh page and verify status update
      await page.reload()
      await expect(page.locator('[data-testid="flag-badge"]')).toContainText('Under Review')
      
      // Test resolved status
      await page.request.patch(`/api/flags/${TEST_BOOK.id}`, {
        data: { status: 'resolved' }
      })
      
      await page.reload()
      await expect(page.locator('[data-testid="flag-badge"]')).toContainText('Resolved')
    })

    test('should disable flagging for resolved items', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Create and resolve a flag
      await createTestFlag(page)
      await page.request.patch(`/api/flags/${TEST_BOOK.id}`, {
        data: { status: 'resolved' }
      })
      await page.reload()
      
      // Flag button should be disabled
      await expect(page.locator('[data-testid="flag-button"]')).toBeDisabled()
      
      // Context menu should not allow flagging
      await page.click('[data-testid="book-title"]', { button: 'right' })
      const flagMenuItem = page.locator('[data-testid="flag-context-menu-item"]')
      
      if (await flagMenuItem.isVisible()) {
        await expect(flagMenuItem).toBeDisabled()
      }
    })

    test('should allow updating open flags', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Create a flag
      await createTestFlag(page)
      
      // Should be able to flag again (update existing flag)
      await page.click('[data-testid="flag-button"]')
      await page.waitForSelector('[data-testid="flagging-form"]')
      
      // Form should show it's updating an existing flag
      await expect(page.locator('[data-testid="form-title"]')).toContainText('Update Flag')
      
      // Should pre-populate with existing data
      await expect(page.locator('[data-testid="description-textarea"]')).toHaveValue(TEST_FLAG.description)
    })
  })

  test.describe('Admin Flag Management', () => {
    test('should allow admin to view and resolve flags', async ({ page }) => {
      // Create flag as user first
      await loginAsUser(page)
      await navigateToInventory(page)
      await createTestFlag(page)
      
      // Login as admin
      await loginAsAdmin(page)
      
      // Navigate to admin flags page
      await page.click('[data-testid="admin-nav-link"]')
      await page.click('[data-testid="flags-admin-link"]')
      await page.waitForURL('/admin/flags')
      
      // Verify flag appears in admin table
      await expect(page.locator('[data-testid="flags-table"]')).toBeVisible()
      await expect(page.locator('[data-testid="flag-row"]')).toContainText(TEST_FLAG.description)
      
      // Click on flag to view details
      await page.click('[data-testid="flag-row"]')
      await page.waitForSelector('[data-testid="flag-detail-modal"]')
      
      // Verify flag details
      await expect(page.locator('[data-testid="flag-type"]')).toContainText('Incorrect Data')
      await expect(page.locator('[data-testid="flag-severity"]')).toContainText('Medium')
      await expect(page.locator('[data-testid="flag-description"]')).toContainText(TEST_FLAG.description)
      
      // Resolve the flag
      await page.fill('[data-testid="resolution-notes"]', 'Fixed the publication year.')
      await page.click('[data-testid="resolve-flag-button"]')
      
      // Verify success
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Flag resolved')
      
      // Flag should now show as resolved
      await expect(page.locator('[data-testid="flag-status"]')).toContainText('Resolved')
    })

    test('should allow admin to reject flags', async ({ page }) => {
      // Create flag as user
      await loginAsUser(page)
      await navigateToInventory(page)
      await createTestFlag(page)
      
      // Login as admin and navigate to flags
      await loginAsAdmin(page)
      await page.goto('/admin/flags')
      
      // Open flag details
      await page.click('[data-testid="flag-row"]')
      await page.waitForSelector('[data-testid="flag-detail-modal"]')
      
      // Reject the flag
      await page.fill('[data-testid="resolution-notes"]', 'Information is correct as-is.')
      await page.click('[data-testid="reject-flag-button"]')
      
      // Verify rejection
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Flag rejected')
      await expect(page.locator('[data-testid="flag-status"]')).toContainText('Rejected')
    })

    test('should filter and search flags', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/admin/flags')
      
      // Test status filter
      await page.selectOption('[data-testid="status-filter"]', 'open')
      await page.waitForResponse(response => response.url().includes('/api/flags'))
      
      // Test table name filter
      await page.selectOption('[data-testid="table-filter"]', 'books')
      await page.waitForResponse(response => response.url().includes('/api/flags'))
      
      // Test search
      await page.fill('[data-testid="search-input"]', 'publication year')
      await page.waitForTimeout(500) // Debounce delay
      await page.waitForResponse(response => response.url().includes('/api/flags'))
      
      // Verify filtered results
      const rows = page.locator('[data-testid="flag-row"]')
      await expect(rows).toHaveCount(1)
    })
  })

  test.describe('Keyboard Navigation and Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Test keyboard shortcut to open flag form
      await page.press('body', 'Control+Shift+KeyR')
      await page.waitForSelector('[data-testid="flagging-form"]')
      
      // Test tab navigation through form
      await page.press('[data-testid="flag-type-select"]', 'Tab')
      await expect(page.locator('[data-testid="severity-select"]')).toBeFocused()
      
      await page.press('[data-testid="severity-select"]', 'Tab')
      await expect(page.locator('[data-testid="description-textarea"]')).toBeFocused()
      
      // Test escape to close form
      await page.press('body', 'Escape')
      await expect(page.locator('[data-testid="flagging-form"]')).not.toBeVisible()
    })

    test('should have proper ARIA attributes', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Check flag button accessibility
      const flagButton = page.locator('[data-testid="flag-button"]')
      await expect(flagButton).toHaveAttribute('aria-label')
      await expect(flagButton).toHaveAttribute('aria-describedby')
      
      // Check context menu accessibility
      await page.click('[data-testid="book-title"]', { button: 'right' })
      const contextMenu = page.locator('[data-testid="context-menu"]')
      await expect(contextMenu).toHaveAttribute('role', 'menu')
      
      const menuItem = page.locator('[data-testid="flag-context-menu-item"]')
      await expect(menuItem).toHaveAttribute('role', 'menuitem')
    })

    test('should support screen reader announcements', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Create flag and verify announcements
      await createTestFlag(page)
      
      // Check for live region updates
      const liveRegion = page.locator('[aria-live="polite"]')
      await expect(liveRegion).toContainText('Flag submitted successfully')
    })

    test('should handle focus management correctly', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Open flag form via button
      const flagButton = page.locator('[data-testid="flag-button"]')
      await flagButton.click()
      
      // Focus should move to form
      await expect(page.locator('[data-testid="flag-type-select"]')).toBeFocused()
      
      // Close form and verify focus returns
      await page.press('body', 'Escape')
      await expect(flagButton).toBeFocused()
    })
  })

  test.describe('Error Scenarios and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Simulate offline condition
      await page.context().setOffline(true)
      
      // Try to create flag
      await page.click('[data-testid="flag-button"]')
      await page.waitForSelector('[data-testid="flagging-form"]')
      
      await page.selectOption('[data-testid="flag-type-select"]', 'incorrect_data')
      await page.selectOption('[data-testid="severity-select"]', 'medium')
      await page.click('[data-testid="submit-flag-button"]')
      
      // Should show network error
      await expect(page.locator('[data-testid="toast-error"]')).toContainText('Network error')
      
      // Go back online and retry
      await page.context().setOffline(false)
      await page.click('[data-testid="submit-flag-button"]')
      
      // Should succeed
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    })

    test('should handle concurrent flag submissions', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Open two flag forms simultaneously (in different browser contexts)
      const context2 = await page.context().browser()?.newContext()
      const page2 = await context2?.newPage()
      
      if (page2) {
        await loginAsUser(page2)
        await navigateToInventory(page2)
        
        // Both users try to flag the same item
        await Promise.all([
          createTestFlag(page),
          createTestFlag(page2)
        ])
        
        // Both should succeed (second one updates the first)
        await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
        await expect(page2.locator('[data-testid="toast-success"]')).toBeVisible()
        
        await context2?.close()
      }
    })

    test('should handle missing data gracefully', async ({ page }) => {
      await loginAsUser(page)
      
      // Navigate to a page with missing book data
      await page.goto('/inventory/nonexistent-book-id')
      
      // Should show appropriate error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Book not found')
      
      // Flag buttons should not be present
      await expect(page.locator('[data-testid="flag-button"]')).not.toBeVisible()
    })

    test('should handle permission errors', async ({ page }) => {
      // Login as user with limited permissions
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'limited@test.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')
      
      // Try to access admin flags page
      await page.goto('/admin/flags')
      
      // Should be redirected or show permission error
      await expect(page.locator('[data-testid="permission-error"]')).toContainText('Access denied')
    })
  })

  test.describe('Performance and Responsiveness', () => {
    test('should load flag form quickly', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      const startTime = Date.now()
      
      await page.click('[data-testid="flag-button"]')
      await page.waitForSelector('[data-testid="flagging-form"]')
      
      const loadTime = Date.now() - startTime
      
      // Form should load within 500ms
      expect(loadTime).toBeLessThan(500)
    })

    test('should handle large context data efficiently', async ({ page }) => {
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Create book with large amount of context data
      const largeBook = {
        ...TEST_BOOK,
        description: 'A'.repeat(10000), // Large description
        metadata: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`field${i}`, `value${i}`]))
      }
      
      await page.request.post('/api/test/create-book', { data: largeBook })
      await page.reload()
      
      // Flag form should still open quickly
      const startTime = Date.now()
      await page.click('[data-testid="flag-button"]')
      await page.waitForSelector('[data-testid="flagging-form"]')
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(1000)
    })

    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await loginAsUser(page)
      await navigateToInventory(page)
      
      // Test touch interactions
      await page.tap('[data-testid="flag-button"]')
      await page.waitForSelector('[data-testid="flagging-form"]')
      
      // Form should be responsive
      const form = page.locator('[data-testid="flagging-form"]')
      const boundingBox = await form.boundingBox()
      
      expect(boundingBox?.width).toBeLessThanOrEqual(375)
      
      // Should be able to complete flag submission on mobile
      await page.selectOption('[data-testid="flag-type-select"]', 'incorrect_data')
      await page.selectOption('[data-testid="severity-select"]', 'medium')
      await page.fill('[data-testid="description-textarea"]', 'Mobile test flag')
      
      await page.tap('[data-testid="submit-flag-button"]')
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    })
  })
}) 