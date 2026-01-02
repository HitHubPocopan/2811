
import { test, expect } from '@playwright/test';

test('test export button', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Login
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  try {
    await page.waitForURL('http://localhost:3000/admin/dashboard', { timeout: 10000 });
  } catch (e) {
    await page.screenshot({ path: 'login-failure.png' });
    throw e;
  }
  
  // Go to products page
  await page.goto('http://localhost:3000/admin/products');
  
  // Wait for products to load
  try {
    await page.waitForSelector('h1:has-text("Gestión de Productos")', { timeout: 10000 });
  } catch (e) {
    await page.screenshot({ path: 'products-page-failure.png' });
    throw e;
  }
  
  // Click export button
  const [ download ] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Exportar")')
  ]);
  
  console.log('Download path:', await download.path());
  console.log('Download filename:', download.suggestedFilename());
});
