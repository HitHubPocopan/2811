# Guía de Pruebas E2E

Este proyecto incluye pruebas end-to-end (E2E) usando **Playwright** para validar el funcionamiento correcto del sistema.

## 📋 Requisitos

- Node.js 18+
- npm instalado
- Proyecto configurado con `.env.local`
- Servidor de desarrollo ejecutándose o disponible en http://localhost:3000

## 🧪 Ejecutar pruebas

### Ejecutar todas las pruebas
```bash
npm test
```

### Ejecutar pruebas en modo interactivo (UI)
```bash
npm run test:ui
```

### Ejecutar pruebas con navegador visible
```bash
npm run test:headed
```

### Ejecutar pruebas en modo debug
```bash
npm run test:debug
```

### Ejecutar pruebas específicas
```bash
npm test -- tests/auth.spec.ts
npm test -- tests/pos-checkout.spec.ts
npm test -- tests/admin.spec.ts
```

## 📁 Estructura de pruebas

```
tests/
├── auth.spec.ts           # Pruebas de autenticación y login
├── pos-checkout.spec.ts   # Pruebas del flujo de compra en POS
└── admin.spec.ts          # Pruebas del panel de administrador
```

## 🔍 Descripción de pruebas

### auth.spec.ts - Autenticación

| Prueba | Descripción |
|--------|-------------|
| debe mostrar la página de login | Verifica que la interfaz de login esté visible |
| debe rechazar credenciales inválidas | Intenta login con credenciales incorrectas |
| debe permitir login de admin | Login exitoso como administrador |
| debe permitir login de POS | Login exitoso como punto de venta |
| debe permitir logout | Verifica que el usuario pueda cerrar sesión |

### pos-checkout.spec.ts - Flujo de compra

| Prueba | Descripción |
|--------|-------------|
| debe mostrar catálogo de productos | Verifica que los productos se carguen correctamente |
| debe agregar productos al carrito | Agrega un producto y verifica que aparezca en el carrito |
| debe actualizar cantidad en carrito | Modifica la cantidad de un producto |
| debe eliminar producto del carrito | Remueve un producto del carrito |
| debe completar una venta | Flujo completo: agregar productos, checkout, confirmación |
| debe ver el historial de ventas | Verifica que el historial se actualice después de una venta |

### admin.spec.ts - Panel administrativo

| Prueba | Descripción |
|--------|-------------|
| debe mostrar dashboard con estadísticas | Verifica que el dashboard cargue correctamente |
| debe permitir acceder a gestión de productos | Navega a la sección de productos |
| debe permitir crear un nuevo producto | Crea un nuevo producto desde la interfaz |
| debe permitir editar un producto | Edita un producto existente |
| debe permitir eliminar un producto | Elimina un producto |
| debe ver la tabla de productos | Verifica que la tabla de productos esté visible |

## ⚙️ Configuración

El archivo `playwright.config.ts` contiene la configuración:

- **Base URL**: http://localhost:3000
- **Navegador**: Chromium
- **Modo headless**: Activado por defecto
- **Retries en CI**: 2 intentos
- **Servidor web**: Inicia automáticamente `npm run dev`

## 🚀 Ejecutar en CI/CD

Para ejecutar las pruebas en un entorno de CI (como GitHub Actions):

```bash
npm test
```

Las pruebas se ejecutarán en modo headless con 2 reintentos automáticos si fallan.

## 📊 Reportes

Después de ejecutar las pruebas, se genera un reporte HTML en:
```
playwright-report/index.html
```

Para ver el reporte:
```bash
npx playwright show-report
```

## 🔧 Debugging

### Ver trazas de fallo
```bash
npx playwright show-trace trace.zip
```

### Modo inspector
```bash
npm run test:debug
```

Esto abrirá el Inspector de Playwright donde puedes:
- Pausar y reanudar la ejecución
- Inspeccionar elementos
- Ejecutar comandos en la consola
- Ver trazas de ejecución

## 💡 Mejores prácticas

1. **Selectores**: Usa selectores simples y estables
2. **Esperas**: Usa `waitForNavigation()` para cambios de página
3. **Datos de prueba**: Usa los datos de prueba proporcionados
4. **Independencia**: Cada prueba debe ser independiente
5. **Nombrado claro**: Los nombres de pruebas deben ser descriptivos

## 🤝 Ejemplo: Agregar una nueva prueba

```typescript
import { test, expect } from '@playwright/test';

test('debe hacer algo específico', async ({ page }) => {
  // 1. Navegar
  await page.goto('/');

  // 2. Interactuar
  await page.click('button:has-text("Click me")');
  await page.fill('input[type="text"]', 'valor');

  // 3. Verificar
  await expect(page.locator('text=Success')).toBeVisible();
});
```

## ⚠️ Problemas comunes

### Pruebas fallan con "timeout"
- Aumenta el timeout en playwright.config.ts
- Verifica que el servidor esté corriendo correctamente
- Revisa que no haya errores en la consola del navegador

### No encuentra elementos
- Verifica que los selectores sean correctos
- Usa `page.pause()` para pausar y inspeccionar
- Usa modo debug para ver qué está pasando

### Pruebas pasan localmente pero fallan en CI
- Verifica variables de entorno en CI
- Revisa tiempos de espera más generosos
- Aumenta el número de retries

## 📚 Recursos

- [Documentación de Playwright](https://playwright.dev)
- [API Reference](https://playwright.dev/docs/api/class-page)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

**Nota**: Las pruebas requieren que la base de datos esté configurada correctamente y que los datos de prueba existan en Supabase.
