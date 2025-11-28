# 📝 Pasos para actualizar Supabase

## ⚠️ IMPORTANTE: Sigue estos pasos EN ORDEN

---

## SCRIPT 1️⃣: Actualizar usuarios y contraseñas

### 1. Abre Supabase en tu navegador
- Ve a https://supabase.com
- Inicia sesión en tu cuenta
- Abre tu proyecto

### 2. Abre el SQL Editor
- En el menú izquierdo, haz clic en **"SQL Editor"**

### 3. Copia y ejecuta el PRIMER script
Copia TODO este código:

```sql
DELETE FROM users WHERE email IN ('pos1@test.com', 'pos2@test.com', 'pos3@test.com', 'anabel@test.com', 'sofia@test.com', 'jano@test.com');

INSERT INTO users (email, password_hash, role, pos_number, name) VALUES
('anabel@test.com', '1fbc3a6036d5ca07a49c8573c9de5e9d8be36f2392c4ed7011ffaec1786051c8', 'pos', 1, 'Costa del Este'),
('sofia@test.com', '877295fd5aaef9128b0a3190b6ce6b2001f3dd5a4a53ce458fb25ec93a96b43c', 'pos', 2, 'Mar de las Pampas'),
('jano@test.com', '0cc15c46fef4eb66035590115388185e0a0346c149ee26a89bf0f947c5f52373', 'pos', 3, 'Costa Esmeralda');

SELECT email, name, pos_number, role FROM users WHERE role = 'pos' ORDER BY pos_number;
```

- Haz clic en **"New Query"**
- Pega el código
- Haz clic en **"RUN"**

✅ Deberías ver una tabla con 3 usuarios

---

## SCRIPT 2️⃣: Agregar categorías y subcategorías

### 4. Copia y ejecuta el SEGUNDO script
Haz clic en **"New Query"** nuevamente

Copia TODO este código:

```sql
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);

UPDATE products SET category = 'Computadoras', subcategory = 'Laptops' WHERE name = 'Laptop';
UPDATE products SET category = 'Periféricos', subcategory = 'Mouse' WHERE name = 'Mouse';
UPDATE products SET category = 'Periféricos', subcategory = 'Teclados' WHERE name = 'Teclado';
UPDATE products SET category = 'Pantallas', subcategory = 'Monitores' WHERE name = 'Monitor';
UPDATE products SET category = 'Audio', subcategory = 'Auriculares' WHERE name = 'Headphones';
UPDATE products SET category = 'Video', subcategory = 'Webcams' WHERE name = 'Webcam';
UPDATE products SET category = 'Conectividad', subcategory = 'Hubs' WHERE name = 'USB Hub';
UPDATE products SET category = 'Almacenamiento', subcategory = 'Unidades SSD' WHERE name = 'SSD';
UPDATE products SET category = 'Componentes', subcategory = 'Memoria' WHERE name = 'RAM';
UPDATE products SET category = 'Componentes', subcategory = 'Fuentes de poder' WHERE name = 'Fuente de poder';

SELECT id, name, category, subcategory FROM products ORDER BY category, subcategory;
```

- Pega el código
- Haz clic en **"RUN"**

✅ Deberías ver una tabla con todos los productos y sus categorías

---

## 7. Prueba la aplicación

### Login de usuarios:
- **Anabel (Costa del Este)**: anabel@test.com / pocopan1711
- **Sofía (Mar de las Pampas)**: sofia@test.com / pocopan2722
- **Jano (Costa Esmeralda)**: jano@test.com / pocopan3733

### Nuevas funcionalidades:
1. ✅ El catálogo NO muestra la columna de stock
2. ✅ El catálogo muestra categoría y subcategoría de cada producto
3. ✅ Al lado de la búsqueda, puedes filtrar por:
   - **Categoría** (Computadoras, Periféricos, Audio, etc.)
   - **Sub-Categoría** (depende de la categoría seleccionada)
4. ✅ Los filtros funcionan junto con la búsqueda de texto

---

**¡Listo! Tu aplicación está actualizada.** 🎉
