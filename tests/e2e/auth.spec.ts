// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

const DEMO_USER_EMAIL = 'test.user+ux@demo.local';
const DEMO_PASSWORD = 'demo-password-123';

test.describe('Authentication Flow', () => {
  test('should sign in with demo user and load dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in credentials
    await page.fill('[data-testid="email-input"]', DEMO_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', DEMO_PASSWORD);

    // Submit form
    await page.click('[data-testid="sign-in-button"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');

    // Verify dashboard elements are present
    await expect(page.locator('[data-testid="budget-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-transactions"]')).toBeVisible();

    // Check for demo data
    await expect(page.locator('text=Whole Foods Market')).toBeVisible();
    await expect(page.locator('text=Monthly salary deposit')).toBeVisible();
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');

    await page.click('[data-testid="sign-in-button"]');

    // Should show error message
    await expect(page.locator('[role="alert"]')).toContainText('Invalid credentials');
  });
});

// tests/e2e/transactions.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Transaction Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', DEMO_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', DEMO_PASSWORD);
    await page.click('[data-testid="sign-in-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should add new expense transaction', async ({ page }) => {
    // Click add transaction button
    await page.click('[data-testid="add-transaction-button"]');

    // Fill in expense details
    await page.fill('[data-testid="amount-input"]', '25.50');
    await page.fill('[data-testid="description-input"]', 'Test lunch expense');
    await page.fill('[data-testid="merchant-input"]', 'Test Restaurant');

    // Select category
    await page.click('[data-testid="category-dining-out"]');

    // Submit transaction
    await page.click('[data-testid="add-expense-button"]');

    // Verify transaction appears in list
    await expect(page.locator('text=Test lunch expense')).toBeVisible();
    await expect(page.locator('text=Test Restaurant')).toBeVisible();
    await expect(page.locator('text=$25.50')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('[data-testid="add-transaction-button"]');

    // Try to submit without required fields
    await page.click('[data-testid="add-expense-button"]');

    // Should show validation errors
    await expect(page.locator('text=Amount is required')).toBeVisible();
    await expect(page.locator('text=Description is required')).toBeVisible();
  });

  test('should filter transactions by category', async ({ page }) => {
    // Navigate to transactions page
    await page.click('[data-testid="view-all-transactions"]');

    // Apply category filter
    await page.selectOption('[data-testid="category-filter"]', 'Dining Out');

    // Verify only dining transactions are shown
    await expect(page.locator('text=Starbucks')).toBeVisible();
    await expect(page.locator('text=The Italian Place')).toBeVisible();
    await expect(page.locator('text=Whole Foods Market')).not.toBeVisible();
  });
});

// tests/e2e/budgets.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Budget Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', DEMO_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', DEMO_PASSWORD);
    await page.click('[data-testid="sign-in-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should update budget amounts', async ({ page }) => {
    // Navigate to budget page
    await page.click('[data-testid="budgets-link"]');

    // Edit groceries budget
    await page.click('[data-testid="edit-budget-groceries"]');
    await page.fill('[data-testid="budget-amount-input"]', '650');
    await page.click('[data-testid="save-budget-button"]');

    // Verify budget was updated
    await expect(page.locator('[data-testid="groceries-budget-amount"]')).toContainText('$650');

    // Verify budget overview reflects changes
    await page.click('[data-testid="dashboard-link"]');
    await expect(page.locator('[data-testid="total-budget"]')).toContainText('$1,450'); // 650 + 300 + 200 + 150 + 100 + 100
  });

  test('should show budget progress indicators', async ({ page }) => {
    await page.click('[data-testid="budgets-link"]');

    // Check progress bars are visible and functional
    const progressBars = page.locator('[data-testid^="budget-progress-"]');
    await expect(progressBars).toHaveCountGreaterThan(0);

    // Check over-budget categories are highlighted
    const overBudgetItems = page.locator('[data-testid^="budget-item-over-"]');
    if (await overBudgetItems.count() > 0) {
      await expect(overBudgetItems.first()).toHaveClass(/text-red/);
    }
  });
});

// tests/e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', DEMO_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', DEMO_PASSWORD);
    await page.click('[data-testid="sign-in-button"]');
    await page.waitForURL('/dashboard');
  });

  test('dashboard should match visual baseline', async ({ page }) => {
    // Wait for all content to load
    await page.waitForSelector('[data-testid="budget-overview"]');
    await page.waitForSelector('[data-testid="recent-transactions"]');

    // Take screenshot
    await expect(page).toHaveScreenshot('dashboard.png');
  });

  test('expense modal should match visual baseline', async ({ page }) => {
    await page.click('[data-testid="add-transaction-button"]');
    await page.waitForSelector('[data-testid="expense-modal"]');

    await expect(page.locator('[data-testid="expense-modal"]')).toHaveScreenshot('expense-modal.png');
  });

  test('insights page should match visual baseline', async ({ page }) => {
    await page.click('[data-testid="insights-link"]');
    await page.waitForSelector('[data-testid="category-chart"]');

    await expect(page).toHaveScreenshot('insights-page.png');
  });

  test('mobile viewport should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    // Check navigation is mobile-friendly
    await expect(page.locator('[data-testid="bottom-navigation"]')).toBeVisible();

    // Check content adapts to mobile
    await expect(page.locator('[data-testid="budget-overview"]')).toBeVisible();

    await expect(page).toHaveScreenshot('dashboard-mobile.png');
  });
});

// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', DEMO_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', DEMO_PASSWORD);
    await page.click('[data-testid="sign-in-button"]');
    await page.waitForURL('/dashboard');
  });

  test('dashboard should be accessible', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('expense modal should be accessible', async ({ page }) => {
    await page.click('[data-testid="add-transaction-button"]');
    await page.waitForSelector('[data-testid="expense-modal"]');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through main navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="dashboard-link"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="insights-link"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="add-transaction-button"]')).toBeFocused();

    // Test Enter key activation
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="expense-modal"]')).toBeVisible();

    // Test Escape key to close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="expense-modal"]')).not.toBeVisible();
  });

  test('should have proper ARIA labels and landmarks', async ({ page }) => {
    // Check main landmarks
    await expect(page.locator('main')).toHaveAttribute('role', 'main');
    await expect(page.locator('nav')).toHaveAttribute('role', 'navigation');

    // Check button labels
    await expect(page.locator('[data-testid="add-transaction-button"]')).toHaveAttribute('aria-label');

    // Check form labels
    await page.click('[data-testid="add-transaction-button"]');
    await expect(page.locator('[data-testid="amount-input"]')).toHaveAttribute('aria-describedby');
  });
});

// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
  },
});

// package.json test scripts addition
/*
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:visual-update": "playwright test --update-snapshots",
    "seed:demo": "tsx scripts/seed_local.ts"
  }
}
*/