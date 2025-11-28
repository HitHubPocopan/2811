# Referencia rápida para desarrolladores

## 🚀 Comandos principales

```bash
# Desarrollo local
npm run dev

# Build para producción
npm run build

# Ejecutar build de producción
npm start

# Linting
npm run lint

# Pruebas E2E
npm test                 # Ejecutar todas las pruebas
npm run test:ui         # Pruebas con UI interactiva
npm run test:headed     # Pruebas con navegador visible
npm run test:debug      # Pruebas en modo debug
```

## 📁 Estructura del proyecto

```
app/                     # Rutas y páginas de Next.js
├── page.tsx            # Login
├── admin/
│   ├── dashboard/      # Dashboard del admin
│   └── products/       # Gestión de productos
└── pos/
    ├── catalog/        # Catálogo de productos
    ├── checkout/       # Checkout
    ├── confirmation/   # Confirmación de venta
    ├── sales/          # Historial de ventas
    └── stats/          # Estadísticas del POS

components/             # Componentes reutilizables
├── Navbar.tsx
└── Cart.tsx

lib/                    # Lógica compartida
├── types.ts           # Tipos TypeScript
├── supabase.ts        # Cliente Supabase
├── store.ts           # Estado con Zustand
└── services/
    ├── auth.ts        # Autenticación
    ├── products.ts    # Productos
    └── sales.ts       # Ventas

database/              # SQL
└── schema.sql         # Esquema de base de datos

tests/                 # Pruebas E2E con Playwright
├── auth.spec.ts
├── pos-checkout.spec.ts
└── admin.spec.ts
```

## 🔐 Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Vive en `.env.local` (no commitear)

## 📚 Documentación

- `README.md` - Descripción general del proyecto
- `SETUP.md` - Configuración inicial
- `INSTALACION.md` - Guía paso a paso
- `TESTING.md` - Guía de pruebas E2E

## 🗄️ Base de datos

### Tablas principales
- `users` - Usuarios (admin y POS)
- `products` - Catálogo de productos
- `sales` - Registro de ventas
- `sessions` - Sesiones activas

### Ejecutar migraciones
1. Ve a Supabase SQL Editor
2. Copia contenido de `database/schema.sql`
3. Pégalo y ejecuta

## 🔑 Datos de prueba

| Email | Contraseña | Usuario | Rol |
|-------|-----------|---------|-----|
| admin@test.com | admin123 | Admin | Admin |
| anabel@test.com | pocopan1711 | Anabel (Costa del Este) | POS 1 |
| sofia@test.com | pocopan2722 | Sofía (Mar de las Pampas) | POS 2 |
| jano@test.com | pocopan3733 | Jano (Costa Esmeralda) | POS 3 |

## 🛠️ Desarrollo

### Agregar nueva página POS
1. Crear archivo en `app/pos/[nombre]/page.tsx`
2. Importar `Navbar` y verificar autenticación
3. Usar servicios de `lib/services/`
4. Usar Zustand store si necesita estado

### Agregar nueva página Admin
1. Crear archivo en `app/admin/[nombre]/page.tsx`
2. Importar `Navbar` y verificar rol admin
3. Usar servicios para obtener datos
4. Crear tabla o gráficos si es necesario

### Servicio nuevo
1. Crear archivo en `lib/services/[nombre].ts`
2. Exportar objeto con métodos async
3. Usar `supabase` o `supabaseAdmin` según permisos
4. Manejar errores y retornar null en fallos

## 🧪 Agregar prueba E2E

```typescript
import { test, expect } from '@playwright/test';

test.describe('Descripción', () => {
  test('debe hacer algo', async ({ page }) => {
    await page.goto('/');
    // Tu prueba aquí
  });
});
```

Ubicar en `tests/` con extensión `.spec.ts`

## ⚡ Performance

- Zustand con persist para estado local
- localStorage para carrito
- Consultas directas a Supabase (sin middleware)
- Recharts para gráficos

## 🚀 Deploy en Vercel

1. Push a GitHub
2. Importar en Vercel
3. Agregar env vars
4. Deploy automático

## 🐛 Troubleshooting

### Errores comunes

**Error: Cannot find module**
```bash
npm install
npm run dev
```

**Supabase connection failed**
- Verificar `.env.local`
- Verificar credenciales en Supabase
- Verificar que proyecto esté activo

**Tests fallan**
- `npm run dev` debe estar ejecutándose
- Datos de prueba en Supabase
- Verificar selectores en tests

## 📝 Notas importantes

- No commitear `.env.local`
- Usar tipos TypeScript siempre
- Validar entrada del usuario
- Manejar errores en servicios
- Las sesiones expiran en 30 días
- Stock se actualiza al completar venta

---

Para más detalles, ver documentación completa en los archivos .md
