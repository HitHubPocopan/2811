# Guía de Instalación - Pocopán Juguetería

## 🔧 Paso 1: Configurar Supabase

### 1.1 Crear una cuenta y proyecto

1. Ve a https://supabase.com y regístrate (o inicia sesión si ya tienes cuenta)
2. Haz clic en "New Project"
3. Selecciona una organización (crea una si no tienes)
4. Completa los datos:
   - **Project name**: `sistema-ventas` (o el que prefieras)
   - **Database password**: Guarda esto, lo necesitarás
   - **Region**: Elige la más cercana a tu ubicación

### 1.2 Obtener las credenciales

Una vez creado el proyecto:

1. Ve a Settings > API
2. En la sección "Project API keys", encontrarás:
   - **URL**: Copia esto en `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: Copia esto en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: Copia esto en `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Crear la base de datos

1. En Supabase, ve a "SQL Editor" en el menú izquierdo
2. Haz clic en "New Query"
3. Abre el archivo `database/schema.sql` de este proyecto
4. Copia TODO el contenido
5. Pégalo en el editor de SQL de Supabase
6. Haz clic en "Run" (botón azul en la esquina inferior derecha)
7. Espera a que se complete la ejecución

✅ Si no hay errores, tu base de datos está lista.

## 📋 Paso 2: Configurar el proyecto local

### 2.1 Clonar o descargar el repositorio

```bash
cd c:\Users\54225\Desktop\2811
```

### 2.2 Crear archivo `.env.local`

1. En la raíz del proyecto, copia el archivo `.env.local.example`:
   ```bash
   copy .env.local.example .env.local
   ```

2. Abre `.env.local` en tu editor favorito

3. Reemplaza los valores con tus credenciales de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
   ```

### 2.3 Instalar dependencias

```bash
npm install
```

(Este paso puede tomar 1-2 minutos)

## 🚀 Paso 3: Ejecutar localmente

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:3000

## 🧪 Paso 4: Probar con datos de prueba

La base de datos ya viene con usuarios de prueba incluidos. Intenta:

### Datos de prueba disponibles

**Admin:**
```
Email: admin@test.com
Contraseña: admin123
Rol: Administrador
```

**Costa del Este (Anabel):**
```
Email: anabel@test.com
Contraseña: pocopan1711
Rol: Punto de Venta 1
```

**Mar de las Pampas (Sofía):**
```
Email: sofia@test.com
Contraseña: pocopan2722
Rol: Punto de Venta 2
```

**Costa Esmeralda (Jano):**
```
Email: jano@test.com
Contraseña: pocopan3733
Rol: Punto de Venta 3
```

## 🔍 Verificación de la instalación

### Checklist
- [ ] Supabase project creado
- [ ] Credenciales copiadas correctamente
- [ ] Script SQL ejecutado en Supabase
- [ ] `.env.local` configurado
- [ ] `npm install` completado
- [ ] `npm run dev` ejecutándose sin errores
- [ ] Puedo acceder a http://localhost:3000
- [ ] Login con datos de prueba funciona

## 🌐 Despliegue en Vercel

Una vez que todo funciona localmente:

### 3.1 Preparar GitHub

1. Inicializa git (si no lo has hecho):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Pocopán Juguetería"
   git branch -M main
   ```

2. Crea un repositorio en GitHub y sube tu código

### 3.2 Desplegar en Vercel

1. Ve a https://vercel.com
2. Haz clic en "Add New" > "Project"
3. Conecta tu repositorio de GitHub
4. Selecciona el proyecto
5. En "Environment Variables", agrega:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
6. Haz clic en "Deploy"

✅ Tu aplicación estará lista en una URL de Vercel

## 🆘 Solución de problemas

### Error: "Cannot find module '@supabase/supabase-js'"
**Solución:** Ejecuta `npm install` nuevamente

### Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"
**Solución:** Verifica que `.env.local` exista y tenga las variables correctas. Reinicia `npm run dev`

### Error: "Connection refused" o "Cannot connect to Supabase"
**Solución:**
- Verifica que la URL de Supabase sea correcta
- Verifica que las claves de API sean correctas
- Asegúrate de que el proyecto en Supabase esté activo

### Login no funciona
**Solución:**
- Verifica que hayas ejecutado el script SQL completo
- Comprueba que los usuarios de prueba existan en la tabla `users`
- Verifica que las contraseñas sean exactas (son case-sensitive)

### No veo productos en el catálogo
**Solución:**
- Verifica que la tabla `products` tenga datos
- En Supabase, ve a Data Editor y revisa la tabla `products`
- Si está vacía, el script SQL no se ejecutó correctamente

### Los cambios de código no se reflejan
**Solución:**
- Reinicia `npm run dev`
- Limpia la caché del navegador (Ctrl+Shift+Del)
- Verifica que no haya errores en la consola del navegador

## 📞 Soporte

Si necesitas ayuda:
1. Revisa que hayas seguido todos los pasos
2. Verifica los archivos `README.md` y `SETUP.md`
3. Comprueba que todas las dependencias se instalaron correctamente

---

**¡Listo!** Tu sistema Pocopán Juguetería está configurado y funcionando.
