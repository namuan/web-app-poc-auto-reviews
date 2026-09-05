import { test, expect } from '../support/journey';

test(
  'delivery address screen has an intentional visual baseline',
  { tag: '@profile' },
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
    await expect(page).toHaveScreenshot('delivery-address.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02
    });
  }
);
