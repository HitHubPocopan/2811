# Sistema de Gestión de Ventas Multi-POS

Un sistema web robusto de gestión de ventas para múltiples puntos de venta con un panel administrativo centralizado.

## 🎯 Características principales

### Para Puntos de Venta (POS)
- ✅ Catálogo de productos con búsqueda y filtrado
- ✅ Carrito de compras interactivo
- ✅ Finalización de ventas con confirmación
- ✅ Historial completo de ventas
- ✅ Estadísticas personalizadas del punto de venta
- ✅ Productos más vendidos
- ✅ Actualización automática de stock

### Para Administrador
- ✅ Dashboard centralizado con métricas globales
- ✅ Gestión completa de catálogo (crear, editar, eliminar productos)
- ✅ Visualización de ventas de todos los puntos de venta
- ✅ Análisis de productos más vendidos a nivel global
- ✅ Reportes con gráficos interactivos

### Técnico
- ✅ Autenticación segura por usuario/contraseña
- ✅ Almacenamiento persistente en PostgreSQL (Supabase)
- ✅ Gestión de estado con Zustand
- ✅ Interfaz responsiva con Tailwind CSS
- ✅ Gráficos con Recharts
- ✅ Deployment en Vercel

## 🚀 Inicio rápido

### Requisitos
- Node.js 18+
- Cuenta en Supabase

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repo>
   cd proyecto
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Supabase**
   - Crea una cuenta en https://supabase.com
   - Crea un nuevo proyecto
   - Ve a SQL Editor y copia todo el contenido de `database/schema.sql`
   - Ejecuta la query

4. **Variables de entorno**
   ```bash
   cp .env.local.example .env.local
   ```
   Reemplaza con tus credenciales de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. **Ejecutar localmente**
   ```bash
   npm run dev
   ```
   Abre http://localhost:3000

## 📝 Datos de prueba

| Usuario | Email | Contraseña | Rol |
|---------|-------|-----------|-----|
| Admin | admin@test.com | admin123 | Administrador |
| Anabel (Costa del Este) | anabel@test.com | pocopan1711 | Punto de Venta 1 |
| Sofía (Mar de las Pampas) | sofia@test.com | pocopan2722 | Punto de Venta 2 |
| Jano (Costa Esmeralda) | jano@test.com | pocopan3733 | Punto de Venta 3 |

## 📁 Estructura del proyecto

```
app/
├── page.tsx                      # Login
├── api/
│   └── sales/route.ts           # API de ventas
├── admin/
│   ├── dashboard/page.tsx       # Dashboard admin
│   └── products/page.tsx        # Gestión de productos
└── pos/
    ├── catalog/page.tsx         # Catálogo
    ├── checkout/page.tsx        # Checkout
    ├── confirmation/page.tsx    # Confirmación
    ├── sales/page.tsx           # Historial de ventas
    └── stats/page.tsx           # Estadísticas

components/
├── Navbar.tsx                   # Navegación
└── Cart.tsx                     # Carrito

lib/
├── types.ts                     # Tipos TypeScript
├── supabase.ts                  # Cliente Supabase
├── store.ts                     # Estado (Zustand)
└── services/
    ├── auth.ts                  # Autenticación
    ├── products.ts              # Productos
    └── sales.ts                 # Ventas

database/
└── schema.sql                   # Esquema PostgreSQL
```

## 🗄️ Base de datos

### Tablas
- **users**: Usuarios (admin y POS)
- **products**: Catálogo de productos
- **sales**: Registro de ventas
- **sessions**: Sesiones activas

El esquema completo está en `database/schema.sql`

## 🔐 Autenticación

- Usuario/contraseña con hash SHA256
- Tokens de sesión con expiración
- Roles: `admin` y `pos`
- Almacenamiento seguro en Supabase

## 📊 Dashboards

### Dashboard POS
- Total de ventas del punto de venta
- Ingresos totales
- Items vendidos
- Top 10 productos más vendidos
- Últimas ventas registradas
- Gráficos interactivos

### Dashboard Admin
- Ventas totales (todos los POS)
- Ingresos consolidados
- Items vendidos globalmente
- Top 15 productos más vendidos en la red
- Comparativas por punto de venta

## 🌐 Despliegue

### Vercel (recomendado)

1. Sube tu código a GitHub
2. Importa el proyecto en Vercel
3. Configura las variables de entorno:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```
4. Deploy automático en cada push a `main`

El almacenamiento está garantizado con Supabase (PostgreSQL en la nube).

## 🛠️ Desarrollo

### Scripts disponibles

```bash
npm run dev      # Desarrollo local
npm run build    # Build para producción
npm run start    # Ejecutar build de producción
npm run lint     # Verificar linting
```

### Stack tecnológico

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Estado**: Zustand
- **Gráficos**: Recharts
- **Base de datos**: PostgreSQL (Supabase)
- **Autenticación**: Custom con JWT
- **Deploy**: Vercel

## 📝 Notas importantes

- El carrito se guarda en localStorage automáticamente
- Las ventas se sincronizan en tiempo real con la base de datos
- El stock se actualiza automáticamente al completar una venta
- Los datos de autenticación se persisten en el almacenamiento del cliente
- Las sesiones expiran en 30 días

## 🐛 Solución de problemas

### Error de conexión a Supabase
- Verifica que las variables de entorno sean correctas
- Asegúrate de que la URL comience con `https://`
- Verifica que la clave de API sea válida

### No aparecen los productos
- Ejecuta el script SQL de inicialización
- Verifica que los productos fueron insertados en Supabase

### Problemas con el login
- Verifica que hayas ejecutado `database/schema.sql`
- Las contraseñas deben coincidir con los hashes SHA256

## 📞 Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.

## 📄 Licencia

Privado - Todos los derechos reservados
