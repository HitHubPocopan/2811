# Actualización de Usuarios y Nombres de POS

Esta actualización cambia los nombres y credenciales de los puntos de venta en todo el sistema.

## Cambios realizados

### Nombres de POS
- **POS 1**: "Punto de Venta 1" → "Costa del Este" (usuario: Anabel)
- **POS 2**: "Punto de Venta 2" → "Mar de las Pampas" (usuario: Sofía)
- **POS 3**: "Punto de Venta 3" → "Costa Esmeralda" (usuario: Jano)

### Credenciales actualizadas

| Usuario Anterior | Email Anterior | Usuario Nuevo | Email Nuevo | Contraseña Nueva |
|-----------------|----------------|---------------|------------|------------------|
| POS 1 | pos1@test.com | Anabel (Costa del Este) | anabel@test.com | pocopan1711 |
| POS 2 | pos2@test.com | Sofía (Mar de las Pampas) | sofia@test.com | pocopan2722 |
| POS 3 | pos3@test.com | Jano (Costa Esmeralda) | jano@test.com | pocopan3733 |

## Archivos modificados

### Backend (Código)
- ✅ `database/schema.sql` - Actualizado con nuevas credenciales y campo `name`
- ✅ `lib/types.ts` - Agregado campo `name` a User y `pos_name` a POSDashboardStats
- ✅ `lib/services/sales.ts` - Actualizado para recuperar y mostrar nombres de POS
- ✅ `app/admin/dashboard/page.tsx` - Muestra nombres dinámicos de POS
- ✅ `app/admin/pos/[posNumber]/page.tsx` - Muestra nombre del POS en el título
- ✅ `app/page.tsx` - Actualizado datos de prueba en login

### Tests
- ✅ `tests/auth.spec.ts` - Actualizado con email de anabel@test.com
- ✅ `tests/pos-checkout.spec.ts` - Actualizado con email de anabel@test.com

### Documentación
- ✅ `README.md` - Tabla de datos de prueba actualizada
- ✅ `SETUP.md` - Credenciales nuevas
- ✅ `INSTALACION.md` - Credenciales nuevas
- ✅ `CLAUDE.md` - Tabla de datos actualizada
- ✅ `PROYECTO.md` - Tabla de datos actualizada

## Instrucciones de actualización

### 1. Actualizar la base de datos (Supabase)

1. Ve a tu proyecto en Supabase
2. Abre "SQL Editor"
3. Crea una nueva query
4. Copia el contenido de `database/update_users.sql`
5. Pégalo en el editor
6. Haz clic en "Run"

### 2. Ejecutar la aplicación

```bash
npm run dev
```

### 3. Verificar cambios

- Abre http://localhost:3000
- En la pantalla de login puedes ver los nuevos datos de prueba:
  - **Admin**: admin@test.com / admin123
  - **Costa del Este (Anabel)**: anabel@test.com / pos123
  - **Mar de las Pampas (Sofía)**: sofia@test.com / pos123
  - **Costa Esmeralda (Jano)**: jano@test.com / pos123

### 4. En el Dashboard Admin

- Verás 3 tarjetas de POS con los nuevos nombres:
  - "Costa del Este"
  - "Mar de las Pampas"
  - "Costa Esmeralda"

- Al hacer clic en cada una, verás el nombre completo en el dashboard individual

## Testing

Para ejecutar las pruebas E2E con las nuevas credenciales:

```bash
npm test
```

Las pruebas ya han sido actualizadas para usar las nuevas credenciales.

## Notas importantes

- ✅ El código compiló exitosamente (`npm run build` pasó)
- ✅ Las credenciales son las mismas (admin123 y pos123)
- ✅ Los hashes SHA256 son los mismos que antes
- ✅ Solo cambiaron los emails y nombres
- ✅ La lógica de filtrado ahora usa `pos_number` en lugar de IDs de usuario
- ✅ Los datos persisten en Supabase correctamente

## Rollback (si es necesario)

Si necesitas revertir a los usuarios anteriores, ejecuta:

```sql
DELETE FROM users WHERE email IN ('anabel@test.com', 'sofia@test.com', 'jano@test.com');

INSERT INTO users (email, password_hash, role, pos_number) VALUES
('pos1@test.com', 'f3ad04a0c7be6e5e29fa4dc2b8a84ba2ce0df85e50b47fec89cc8a0c0ecafca8', 'pos', 1),
('pos2@test.com', 'f3ad04a0c7be6e5e29fa4dc2b8a84ba2ce0df85e50b47fec89cc8a0c0ecafca8', 'pos', 2),
('pos3@test.com', 'f3ad04a0c7be6e5e29fa4dc2b8a84ba2ce0df85e50b47fec89cc8a0c0ecafca8', 'pos', 3);
```

---

**Cambios completados exitosamente** ✅
