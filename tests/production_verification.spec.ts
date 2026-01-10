import { test, expect } from '@playwright/test';

test.describe('Producción: Clima, Recambio y WhatsApp', () => {
  
  test.beforeEach(async ({ page }) => {
    // Intercept weather API to ensure consistent test environment
    await page.route('https://api.open-meteo.com/v1/forecast*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          current: { weather_code: 3 } // Nublado
        })
      });
    });

    await page.goto('/');
    // Login as POS 1 (as we know anabel@test.com works from auth.spec.ts)
    await page.fill('input[type="email"]', 'anabel@test.com');
    await page.fill('input[type="password"]', 'pos123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/pos/catalog');
  });

  test('Navbar debe mostrar clima real (Nublado) y botones de WhatsApp para otros POS', async ({ page }) => {
    // Verificar icono de nublado en el pronóstico
    const forecastIcon = page.locator('span:has-text("☁️")');
    await expect(forecastIcon.first()).toBeVisible();

    // Verificar botones de WhatsApp para otros POS
    // POS 1 (Anabel) debe ver POS 2 y POS 3
    const avisoMDP = page.locator('a:has-text("Aviso Mar de las Pampas")');
    const avisoCE = page.locator('a:has-text("Aviso Costa Esmeralda")');
    
    await expect(avisoMDP).toBeVisible();
    await expect(avisoCE).toBeVisible();

    // Verificar que el link de WhatsApp sea correcto para MDP
    const href = await avisoMDP.getAttribute('href');
    expect(href).toContain('wa.me/5492257542171');
  });

  test('Lógica de Recambio Turístico debe activarse en días específicos', async ({ page }) => {
    // Para esta prueba, verificamos que el Dashboard de Admin muestre correctamente el estado
    // Primero cerramos sesión de POS y entramos como Admin
    await page.click('button:has-text("Salir")');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    // El Dashboard de Admin ahora muestra el clima de los 3 POS
    await expect(page.locator('text=POS 1')).toBeVisible();
    await expect(page.locator('text=POS 2')).toBeVisible();
    await expect(page.locator('text=POS 3')).toBeVisible();

    // Verificar que la sección de "Recambio Turístico" esté presente
    const recambioTitle = page.locator('text=Recambio Turístico');
    await expect(recambioTitle).toBeVisible();
    
    // Verificamos si hoy es día de recambio según la lógica (1, 7, 8, 14, 15, 21, 22, 30, 31)
    const today = new Date().getDate();
    const isRecambioDay = [1, 7, 8, 14, 15, 21, 22, 30, 31].includes(today);
    
    if (isRecambioDay) {
        await expect(page.locator('text=Ingreso de Turistas').or(page.locator('text=Egreso de Turistas'))).toBeVisible();
    } else {
        await expect(page.locator('text=Flujo Estándar')).toBeVisible();
    }
  });

  test('Dashboard de Admin no debe mostrar la sección de Notas', async ({ page }) => {
    await page.click('button:has-text("Salir")');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    const notasSection = page.locator('text=Nota de Administrador');
    await expect(notasSection).not.toBeVisible();
  });
});
