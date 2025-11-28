-- Migración para agregar categorías y subcategorías
-- Ejecutar este script en Supabase SQL Editor

-- Paso 1: Agregar columnas si no existen
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);

-- Paso 2: Actualizar productos existentes con categorías y subcategorías
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

-- Verificar que las actualizaciones fueron correctas
SELECT id, name, category, subcategory FROM products ORDER BY category, subcategory;
