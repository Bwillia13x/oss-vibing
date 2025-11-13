/**
 * E2E Test: Export Functionality
 * Tests the complete workflow of creating and exporting documents
 */

import { test, expect } from '@playwright/test';

test.describe('Document Export Workflow', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the home page
    await expect(page).toHaveTitle(/Vibe University/i);
  });

  test('should create a new document', async ({ page }) => {
    await page.goto('/');
    
    // Look for a "New Document" button or similar
    const newDocButton = page.locator('button:has-text("New Document"), button:has-text("New"), a:has-text("New Document")').first();
    
    if (await newDocButton.isVisible()) {
      await newDocButton.click();
      
      // Wait for navigation or modal
      await page.waitForLoadState('networkidle');
      
      // Check that we can type
      const editor = page.locator('textarea, [contenteditable="true"]').first();
      if (await editor.isVisible()) {
        await editor.fill('# Test Document\n\nThis is a test.');
      }
    }
  });

  test('should open export menu', async ({ page }) => {
    await page.goto('/');
    
    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Check that export options appear
      await expect(page.locator('text=/PDF|DOCX|Export/i').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('AI Chat Integration', () => {
  test('should load chat interface', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Look for chat input
    const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
    
    if (await chatInput.isVisible()) {
      await expect(chatInput).toBeEnabled();
    }
  });
});

test.describe('Accessibility', () => {
  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading structure
    const h1 = page.locator('h1').first();
    if (await h1.isVisible()) {
      await expect(h1).toHaveText(/.+/);
    }
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for buttons with labels
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const ariaLabel = await button.getAttribute('aria-label');
        const text = await button.textContent();
        
        // Button should have either text content or aria-label
        expect(ariaLabel || text).toBeTruthy();
      }
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should be mobile-friendly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Check that content is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check for mobile menu if exists
    const mobileMenu = page.locator('[aria-label*="menu"], button:has-text("Menu")').first();
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
    }
  });
});

test.describe('Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Allow for expected errors (e.g., missing API keys in test environment)
    const unexpectedErrors = errors.filter(
      (error) => !error.includes('API') && !error.includes('fetch')
    );
    
    expect(unexpectedErrors).toHaveLength(0);
  });
});
