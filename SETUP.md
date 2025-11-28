# Configuración del Sistema de Ventas Multi-POS

## Requisitos

- Node.js 18+ instalado
- Cuenta en Supabase (https://supabase.com)

## Pasos de configuración

### 1. Crear un proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta
2. Crea un nuevo proyecto
3. Anota los datos:
   - URL del proyecto (NEXT_PUBLIC_SUPABASE_URL)
   - Clave anon (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Clave de servicio (SUPABASE_SERVICE_ROLE_KEY) - disponible en Settings > API

### 2. Crear la base de datos

1. En la consola de Supabase, ve a "SQL Editor"
2. Crea una nueva query
3. Copia el contenido de `database/schema.sql` y pégalo
4. Ejecuta la query

Esto creará todas las tablas necesarias e insertará datos de prueba.

### 3. Configurar variables de entorno

1. Copia `.env.local.example` a `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Reemplaza los valores con tus datos de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 4. Instalar dependencias

```bash
npm install
```

### 5. Ejecutar el proyecto localmente

```bash
npm run dev
```

El proyecto estará disponible en http://localhost:3000

## Datos de prueba

**Admin:**
- Email: admin@test.com
- Contraseña: admin123

**Costa del Este (Anabel):**
- Email: anabel@test.com
- Contraseña: pocopan1711

**Mar de las Pampas (Sofía):**
- Email: sofia@test.com
- Contraseña: pocopan2722

**Costa Esmeralda (Jano):**
- Email: jano@test.com
- Contraseña: pocopan3733

## Despliegue en Vercel

1. Sube el código a GitHub
2. Ve a https://vercel.com/import
3. Selecciona tu repositorio
4. Agrega las variables de entorno en "Environment Variables"
5. Despliega

El almacenamiento de datos está garantizado con Supabase, ya que utiliza PostgreSQL en la nube.

## Estructura del proyecto

```
app/
├── page.tsx                 # Página de login
├── admin/
│   ├── dashboard/page.tsx   # Dashboard general del admin
│   └── products/page.tsx    # Gestión de productos
└── pos/
    ├── catalog/page.tsx     # Catálogo de productos para POS
    ├── checkout/page.tsx    # Checkout/confirmación
    ├── confirmation/page.tsx # Confirmación de venta
    ├── sales/page.tsx       # Historial de ventas
    └── stats/page.tsx       # Estadísticas del POS

components/
├── Navbar.tsx              # Barra de navegación
└── Cart.tsx                # Carrito de compras

lib/
├── types.ts                # Tipos TypeScript
├── supabase.ts             # Cliente de Supabase
├── store.ts                # Estado con Zustand
└── services/
    ├── auth.ts             # Servicio de autenticación
    ├── products.ts         # Servicio de productos
    └── sales.ts            # Servicio de ventas
```

## Características

✅ Sistema de autenticación con usuario/contraseña
✅ 3 Puntos de Venta (POS) con acceso independiente
✅ 1 Administrador con control total
✅ Catálogo de productos con carrito
✅ Finalización de ventas con historial
✅ Dashboard de estadísticas por POS
✅ Dashboard general del admin con métricas consolidadas
✅ Productos más vendidos (por POS y general)
✅ Actualización automática de stock
✅ Almacenamiento persistente en PostgreSQL
