import { test, expect } from '@playwright/test';

test.describe('Flujo de compra - POS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'anabel@test.com');
    await page.fill('input[type="password"]', 'pos123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('debe mostrar catálogo de productos', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Catálogo de Productos');
    await expect(page.locator('text=Laptop')).toBeVisible();
    await expect(page.locator('text=Mouse')).toBeVisible();
    await expect(page.locator('text=Teclado')).toBeVisible();
  });

  test('debe agregar productos al carrito', async ({ page }) => {
    const addButtons = await page.locator('button:has-text("Agregar al carrito")');
    await addButtons.first().click();

    await expect(page.locator('text=Laptop')).toBeVisible();
    await expect(page.locator('text=Carrito')).toBeVisible();
  });

  test('debe actualizar cantidad en carrito', async ({ page }) => {
    const addButtons = await page.locator('button:has-text("Agregar al carrito")');
    await addButtons.first().click();

    const quantityInput = page.locator('input[type="number"]').first();
    await quantityInput.fill('5');

    await expect(quantityInput).toHaveValue('5');
  });

  test('debe eliminar producto del carrito', async ({ page }) => {
    const addButtons = await page.locator('button:has-text("Agregar al carrito")');
    await addButtons.first().click();

    const removeButton = page.locator('button:has-text("Eliminar")').first();
    await removeButton.click();

    await expect(page.locator('text=El carrito está vacío')).toBeVisible();
  });

  test('debe completar una venta', async ({ page }) => {
    const addButtons = await page.locator('button:has-text("Agregar al carrito")');
    await addButtons.first().click();
    await addButtons.nth(1).click();

    const checkoutButton = page.locator('button:has-text("Finalizar venta")');
    await checkoutButton.click();

    await page.waitForNavigation();
    await expect(page.locator('h1')).toContainText('Confirmación de venta');

    const confirmButton = page.locator('button:has-text("Confirmar venta")');
    await confirmButton.click();

    await page.waitForNavigation();
    await expect(page.locator('h1')).toContainText('¡Venta completada!');
  });

  test('debe ver el historial de ventas después de completar una venta', async ({ page }) => {
    const addButtons = await page.locator('button:has-text("Agregar al carrito")');
    await addButtons.first().click();

    const checkoutButton = page.locator('button:has-text("Finalizar venta")');
    await checkoutButton.click();

    await page.waitForNavigation();
    const confirmButton = page.locator('button:has-text("Confirmar venta")');
    await confirmButton.click();

    await page.waitForNavigation();
    await page.click('a:has-text("Historial")');

    await page.waitForNavigation();
    await expect(page.locator('h1')).toContainText('Historial de ventas');
  });
});
