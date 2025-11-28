# 🚀 Despliegue en GitHub y Vercel

Este documento contiene instrucciones paso a paso para subir el proyecto a GitHub y desplegarlo en Vercel.

---

## 📋 Requisitos previos

- Cuenta en GitHub (https://github.com)
- Cuenta en Vercel (https://vercel.com)
- Proyecto local configurado con .env.local
- Git instalado

---

## 1️⃣ Crear repositorio en GitHub

### Paso 1: Crear repositorio vacío

1. Ve a https://github.com/new
2. Completa los datos:
   - **Repository name**: `sistema-ventas-multipos` (o el nombre que prefieras)
   - **Description**: "Sistema de gestión de ventas para múltiples puntos de venta"
   - **Visibility**: Selecciona **Private** (privado) o **Public** según prefieras
3. **NO** inicialices con README, .gitignore o licencia (ya los tenemos)
4. Haz clic en **"Create repository"**

### Paso 2: Copiar URL del repositorio

Después de crear, GitHub te mostrará comandos. Copia la URL HTTPS del repositorio. Se verá algo así:
```
https://github.com/tu-usuario/sistema-ventas-multipos.git
```

---

## 2️⃣ Conectar repositorio local a GitHub

En PowerShell o Terminal (en el directorio del proyecto):

```bash
cd c:\Users\54225\Desktop\2811

# Configurar el repositorio remoto (reemplaza con tu URL)
git remote add origin https://github.com/tu-usuario/sistema-ventas-multipos.git

# Verificar que se configuró correctamente
git remote -v

# Enviar el código a GitHub (rama master o main)
git branch -M main
git push -u origin main
```

Si obtienes un error de autenticación:

### Opción A: Autenticación con token (recomendado)

1. En GitHub: Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Haz clic en **"Generate new token (classic)"**
3. Selecciona permisos: `repo` (acceso completo a repositorios)
4. Copia el token
5. Cuando git te pida contraseña, pega el token

### Opción B: Autenticación con SSH

1. Genera clave SSH (si no tienes):
   ```bash
   ssh-keygen -t ed25519 -C "tu-email@example.com"
   ```
2. Agrega la clave pública a GitHub: Settings > SSH and GPG keys
3. Usa la URL SSH en lugar de HTTPS:
   ```bash
   git remote set-url origin git@github.com:tu-usuario/sistema-ventas-multipos.git
   ```

---

## 3️⃣ Verificar en GitHub

1. Ve a tu repositorio en GitHub (https://github.com/tu-usuario/sistema-ventas-multipos)
2. Verifica que todos los archivos estén allí
3. Verifica que el README.md y otros archivos de documentación sean visibles

---

## 4️⃣ Desplegar en Vercel

### Paso 1: Conectar GitHub a Vercel

1. Ve a https://vercel.com
2. Inicia sesión con GitHub (recomendado) o crea una cuenta
3. Haz clic en **"New Project"** o **"Import Project"**
4. Selecciona **"Continue with GitHub"**
5. Busca tu repositorio `sistema-ventas-multipos`
6. Haz clic en **"Import"**

### Paso 2: Configurar variables de entorno

En la pantalla de configuración de Vercel:

1. **Environment Variables**: Agrega las siguientes variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
   SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
   ```

2. Obtén los valores de tu proyecto Supabase:
   - Ve a Supabase Dashboard
   - Settings > API
   - Copia los valores correspondientes

3. Paste cada valor en Vercel

### Paso 3: Deploy

1. Haz clic en **"Deploy"**
2. Espera a que se complete (normalmente 2-5 minutos)
3. Cuando aparezca "Congratulations", tu aplicación está en vivo

---

## 5️⃣ Tu aplicación en línea

Después del deploy, Vercel te dará una URL como:
```
https://sistema-ventas-multipos.vercel.app
```

### Datos de prueba para login:

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

---

## 6️⃣ Primeros pasos en Supabase (importante)

Antes de que otros puedan acceder, **debes ejecutar el script SQL en Supabase**:

1. Ve a tu proyecto en Supabase
2. Abre "SQL Editor"
3. Crea una nueva query
4. Copia el contenido de `database/update_users.sql`
5. Pégalo en el editor
6. Haz clic en "Run"

Esto actualizará los usuarios con las nuevas credenciales en tu base de datos.

---

## 7️⃣ Actualizaciones futuras

Después del deploy inicial, cualquier cambio que hagas:

1. Edita los archivos localmente
2. Haz commit y push a GitHub:
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git push
   ```
3. Vercel se desplegará automáticamente

---

## ✅ Checklist final

- [ ] Repositorio creado en GitHub
- [ ] Código pusheado a GitHub
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas en Vercel
- [ ] Deploy completado exitosamente
- [ ] URL de Vercel funciona
- [ ] Script SQL ejecutado en Supabase
- [ ] Login funciona con nuevas credenciales
- [ ] Datos visibles en dashboard

---

## 🆘 Troubleshooting

### El deploy falla en Vercel

**Error: "Build failed"**
- Verifica que las variables de entorno sean correctas
- Revisa los logs de build en Vercel
- Ejecuta `npm run build` localmente para verificar

**Error: "Cannot find module"**
- Ejecuta `npm install` localmente
- Haz commit de `package-lock.json`
- Push a GitHub

### No puedo loguear

**"Email o contraseña incorrectos"**
- Verifica que ejecutaste `database/update_users.sql` en Supabase
- Verifica que las credenciales sean exactas (case-sensitive)
- Revisa la consola del navegador (F12) para ver errores

**"Connection to Supabase failed"**
- Verifica las variables de entorno en Vercel
- Asegúrate de que la URL de Supabase sea correcta (debe comenzar con https://)
- Verifica que el proyecto Supabase esté activo

---

## 📞 Soporte

Si necesitas ayuda:

1. Revisa el archivo `README.md` - tiene información general
2. Revisa el archivo `SETUP.md` - tiene configuración detallada
3. Revisa el archivo `INSTALACION.md` - tiene guía paso a paso
4. Revisa los logs de Vercel - muchos errores están ahí

---

**¡Tu aplicación está lista para producción!** 🎉
