# 📊 Guía de Importar/Exportar Productos e Insights

## 🆙 Importar Productos desde Excel

### Estructura del archivo Excel

Crea un archivo Excel con las siguientes columnas **en este orden exacto**:

| Nombre | Categoria | SubCAT | Descripcion | Precio Venta | Imagen |
|--------|-----------|--------|------------|--------------|--------|
| Laptop | Computadoras | Laptops | Laptop Gaming 16GB | 1200 | https://... |
| Mouse | Periféricos | Mouse | Mouse inalámbrico | 25.50 | https://... |
| Teclado | Periféricos | Teclados | Teclado mecánico | 80 | https://... |

### Detalles de cada columna:

- **Nombre** (obligatorio): Nombre del producto
- **Categoria** (opcional): Categoría principal (ej: Computadoras, Periféricos, Audio)
- **SubCAT** (opcional): Sub-categoría (ej: Laptops, Mouse, Auriculares)
- **Descripcion** (opcional): Descripción detallada del producto
- **Precio Venta** (obligatorio): Precio del producto (números decimales con punto)
- **Imagen** (opcional): URL completa de la imagen (ej: https://ejemplo.com/imagen.jpg)

### Cómo importar:

1. Ve a **Gestión de Productos** (en el admin)
2. Haz clic en **⬆️ Importar Excel**
3. Selecciona tu archivo .xlsx
4. Espera a que se procese
5. Verás un mensaje ✅ con la cantidad de productos importados

### Ejemplo de archivo Excel completo:

```
Nombre,Categoria,SubCAT,Descripcion,Precio Venta,Imagen
Laptop ASUS,Computadoras,Laptops,Laptop Gaming RTX 3060,1200,
Mouse Logitech,Periféricos,Mouse,Mouse inalámbrico 2.4GHz,25.50,
Teclado Corsair,Periféricos,Teclados,Teclado mecánico RGB,80,
Monitor LG,Pantallas,Monitores,Monitor 27 pulgadas 144Hz,350,
Audífonos Sony,Audio,Auriculares,Audífonos con cancelación de ruido,180,
```

---

## ⬇️ Exportar Productos a Excel

### Cómo exportar:

1. Ve a **Gestión de Productos** (en el admin)
2. Haz clic en **⬇️ Exportar Excel**
3. Se descargará automáticamente un archivo llamado `productos_YYYY-MM-DD.xlsx`

El archivo contendrá todos tus productos con todas las columnas completas.

---

## 📄 Exportar Insights a PDF

### Qué contiene el reporte:

El PDF incluye:

- **📊 Resumen General**
  - Total de ventas (cantidad)
  - Ingresos totales (dinero)
  - Items vendidos
  - Promedio diario de ingresos

- **🏪 Ventas por Negocio**
  - Detalles para cada POS:
    - Costa del Este
    - Mar de las Pampas
    - Costa Esmeralda
  - Ventas, Ingresos, Items, Promedio Diario por negocio

- **🏆 Productos Más Vendidos (Top 5)**
  - Ranking de los 5 productos más vendidos
  - Cantidad de unidades vendidas
  - Ingresos generados por producto

### Cómo exportar:

1. Ve a **Dashboard Administrativo** (en el admin)
2. Haz clic en **📄 Exportar Insights PDF**
3. Se descargará automáticamente un archivo llamado `insights_YYYY-MM-DD.pdf`

---

## 💡 Tips

### Para importar múltiples productos:

1. Prepara tu Excel con todos los productos
2. Importa el archivo completo de una vez
3. No necesitas hacerlo producto por producto

### Errores comunes al importar:

- ❌ **Falta la columna "Nombre"**: El nombre es obligatorio
- ❌ **Falta la columna "Precio Venta"**: El precio es obligatorio
- ❌ **Precio no es número**: Usa punto (.) para decimales, no coma
- ❌ **Archivo no es .xlsx**: Guarda como Excel moderno, no como .xls

### Actualizar productos:

- No puedes actualizar múltiples productos vía Excel
- Para actualizar, edita producto por producto desde la interfaz
- O elimina y reimporta el archivo actualizado

---

## 📋 Plantilla recomendada

Aquí hay una plantilla que puedes usar (copiar/pegar):

```
Nombre,Categoria,SubCAT,Descripcion,Precio Venta,Imagen
Producto 1,Categoría 1,SubCat 1,Descripción del producto,99.99,
Producto 2,Categoría 2,SubCat 2,Descripción del producto,149.99,
Producto 3,Categoría 1,SubCat 3,Descripción del producto,199.99,
```

---

**¡Listo! Ya puedes importar y exportar tus productos fácilmente.** 🎉
