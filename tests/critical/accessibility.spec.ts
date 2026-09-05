import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../support/journey';

test(
  'customer can use the delivery address screen without detectable serious accessibility violations',
  { tag: '@critical' },
  async ({ page }) => {
    await page.route('**/api/profile/delivery-address', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          fullName: 'Amina Okafor',
          line1: '48 Orchard Lane',
          city: 'Bristol',
          postcode: 'BS1 4QR'
        })
      });
    });
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
);
