import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  // Navigate to login page
  await page.goto('http://localhost:4000/admin');

  // Log in as admin
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('admin');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Create new Training
  await page.getByRole('button').first().click();
  const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
  await page.getByRole('textbox', { name: 'datum' }).fill(today);  
  await page.getByRole('textbox', { name: 'startzeit' }).click();
  await page.getByRole('textbox', { name: 'startzeit' }).fill('15:00');
  await page.getByRole('textbox', { name: 'trainingsdauer' }).click();
  await page.getByRole('textbox', { name: 'trainingsdauer' }).fill('1h');
  await page.locator('.themed > .px-4').first().click();
  await page.waitForTimeout(500)
  await page.getByText('1, Scherrer, Jean-Claude, jc@jcscherrer.com', { exact: true }).click();
  await page.getByText('Normal').click();
  await page.getByText('2, Club/Fixplatz', { exact: true }).click();
  await page.locator('input[type="text"]').nth(1).click();
  await page.getByText('private').first().click();
  await page.locator('div:nth-child(7) > div > .col-span-1 > div > .themed > .px-4').click();
  await page.getByText('rot, Müller, rot, 1,', { exact: true }).click();
  await page.locator('.col-span-1 > .col-span-1 > div > .themed > .px-4').click();
  await page.getByRole('textbox', { name: 'kundes' }).fill('');
  await page.getByText('510, 1, bexio AG, , Rapperswil, null, +41 (0) 71 552 00 60, ,', { exact: true }).click();
  await page.getByRole('button', { name: 'Submit' }).click();

  // Navigate to rapport page
  await page.getByRole('link', { name: 'Rapport', exact: true }).click();

  // Clear previous Filters
  await page.locator('button[buttontext="Clear Filter"]').click();
  await page.waitForTimeout(1000);

  // Add Filters
  await page.locator('button[buttontext="Filter"]').click();
  await page.getByRole('button', { name: 'Choose Date' }).click();
  await page.getByRole('button', { name: 'today' }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.getByRole('textbox', { name: 'trainer' }).click();
  await page.getByText('1, Jean-Claude, Scherrer, jc@jcscherrer.com', { exact: true }).click();
  await page.getByRole('button', { name: 'Apply Filter' }).click();
  await page.waitForTimeout(1000);

  // Delete Training
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
});