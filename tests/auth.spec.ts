import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('debe mostrar la página de login', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Pocopán');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('debe rechazar credenciales inválidas', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'invalido@test.com');
    await page.fill('input[type="password"]', 'password_invalida');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email o contraseña incorrectos')).toBeVisible();
  });

  test('debe permitir login de admin', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('debe permitir login de POS', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'anabel@test.com');
    await page.fill('input[type="password"]', 'pos123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation();
    await expect(page).toHaveURL(/\/pos\/catalog/);
  });

  test('debe permitir logout', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'anabel@test.com');
    await page.fill('input[type="password"]', 'pos123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation();
    await page.click('button:has-text("Salir")');

    await expect(page).toHaveURL(/^\/$/);
  });
});
