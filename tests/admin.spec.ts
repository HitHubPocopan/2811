import { test, expect } from '@playwright/test';

test.describe('Panel de Administrador', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('debe mostrar dashboard con estadísticas', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard General');
    await expect(page.locator('text=Total de ventas')).toBeVisible();
    await expect(page.locator('text=Ingresos totales')).toBeVisible();
    await expect(page.locator('text=Items vendidos')).toBeVisible();
  });

  test('debe permitir acceder a gestión de productos', async ({ page }) => {
    await page.click('a:has-text("Productos")');
    await page.waitForNavigation();

    await expect(page.locator('h1')).toContainText('Gestión de Productos');
  });

  test('debe permitir crear un nuevo producto', async ({ page }) => {
    await page.click('a:has-text("Productos")');
    await page.waitForNavigation();

    await page.click('button:has-text("Nuevo producto")');

    await page.fill('input[placeholder*=""]', 'Producto Test', { force: true });
    const inputs = await page.locator('input[type="text"]');
    await inputs.first().fill('Producto Test');

    const numberInputs = await page.locator('input[type="number"]');
    await numberInputs.first().fill('99.99');
    await numberInputs.nth(1).fill('10');

    await page.click('button:has-text("Crear producto")');

    await expect(page.locator('text=Producto Test')).toBeVisible();
  });

  test('debe permitir editar un producto', async ({ page }) => {
    await page.click('a:has-text("Productos")');
    await page.waitForNavigation();

    await page.click('button:has-text("Editar")');

    const inputs = await page.locator('input[type="text"]');
    await inputs.first().fill('Producto Editado');

    await page.click('button:has-text("Guardar cambios")');

    await expect(page.locator('text=Producto Editado')).toBeVisible();
  });

  test('debe permitir eliminar un producto', async ({ page }) => {
    await page.click('a:has-text("Productos")');
    await page.waitForNavigation();

    const deleteButtons = await page.locator('button:has-text("Eliminar")');
    const initialCount = await deleteButtons.count();

    await deleteButtons.last().click();
    await page.click('button:has-text("Aceptar")');

    const finalCount = await page.locator('button:has-text("Eliminar")').count();
    expect(finalCount).toBeLessThan(initialCount);
  });

  test('debe ver la tabla de productos', async ({ page }) => {
    await page.click('a:has-text("Productos")');
    await page.waitForNavigation();

    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Nombre")')).toBeVisible();
    await expect(page.locator('th:has-text("Precio")')).toBeVisible();
    await expect(page.locator('th:has-text("Stock")')).toBeVisible();
  });
});
