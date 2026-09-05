import { test, expect } from '../support/journey';

const originalAddress = {
  fullName: 'Amina Okafor',
  line1: '48 Orchard Lane',
  city: 'Bristol',
  postcode: 'BS1 4QR'
};

test(
  'customer can change their delivery address and sees it after refresh',
  { tag: ['@profile', '@critical'] },
  async ({ page }) => {
    let savedAddress = originalAddress;
    await page.route('**/api/profile/delivery-address', async (route) => {
      if (route.request().method() === 'PUT') savedAddress = route.request().postDataJSON();
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(savedAddress) });
    });

    await page.goto('/');
    await page.getByLabel('Address line').fill('17 Harbour Street');
    await page.getByRole('button', { name: 'Save delivery address' }).click();
    await expect(page.getByLabel('Address line')).toHaveValue('17 Harbour Street');
    await page.reload();
    await expect(page.getByLabel('Address line')).toHaveValue('17 Harbour Street');
  }
);

test(
  'customer cannot save an address without required fields',
  { tag: '@profile' },
  async ({ page }) => {
    let saveAttempts = 0;
    await page.route('**/api/profile/delivery-address', async (route) => {
      if (route.request().method() === 'PUT') saveAttempts += 1;
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(originalAddress)
      });
    });

    await page.goto('/');
    await page.getByLabel('Postcode').fill('');
    await page.getByRole('button', { name: 'Save delivery address' }).click();
    await expect(page.getByLabel('Postcode')).toBeFocused();
    expect(saveAttempts).toBe(0);
  }
);

test(
  'customer keeps the previous address when the update fails',
  { tag: '@profile' },
  async ({ page }) => {
    await page.route('**/api/profile/delivery-address', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
        return;
      }
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(originalAddress)
      });
    });

    await page.goto('/');
    await page.getByLabel('Town or city').fill('Cardiff');
    await page.getByRole('button', { name: 'Save delivery address' }).click();
    await expect(page.getByRole('alert')).toContainText('Could not save your address.');
    await expect(page.getByLabel('Town or city')).toHaveValue(originalAddress.city);
  }
);
