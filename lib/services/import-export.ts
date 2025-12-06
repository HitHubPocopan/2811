import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Product } from '@/lib/types';
import { salesService } from './sales';

export const importExportService = {
  async importProductsFromExcel(file: File): Promise<Omit<Product, 'id' | 'created_at' | 'updated_at'>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const products = jsonData.map((row: any) => ({
            name: row['Nombre'] || '',
            category: row['Categoria'] || '',
            subcategory: row['SubCAT'] || '',
            description: row['Descripcion'] || '',
            price: parseFloat(row['Precio Venta']) || 0,
            image_url: row['Imagen'] || '',
            stock: 0,
          }));

          resolve(products);
        } catch (error) {
          reject(new Error('Error al leer el archivo Excel'));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  async exportProductsToExcel(products: Product[]): Promise<void> {
    const data = products.map((p) => ({
      Nombre: p.name,
      Categoria: p.category || '',
      SubCAT: p.subcategory || '',
      Descripcion: p.description,
      'Precio Venta': p.price,
      Imagen: p.image_url,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 30 },
      { wch: 15 },
      { wch: 35 },
    ];

    XLSX.writeFile(workbook, `productos_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  async exportInsightsToPDF(dashboardData: any, allSales: any[], salesPerDay: any[] = []): Promise<void> {
    const pdf = new jsPDF();
    let yPosition = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;

    const addSection = (title: string) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 10;
      }
      pdf.setFontSize(14);
      pdf.setFont('', 'bold');
      pdf.text(title, margin, yPosition);
      yPosition += 8;
      pdf.setDrawColor(230, 126, 34);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
    };

    const addText = (label: string, value: string, isBold = false) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 10;
      }
      pdf.setFontSize(11);
      pdf.setFont('', isBold ? 'bold' : 'normal');
      pdf.text(`${label}: ${value}`, margin + 5, yPosition);
      yPosition += 6;
    };

    const POS_NAMES: Record<number, string> = {
      1: 'Costa del Este',
      2: 'Mar de las Pampas',
      3: 'Costa Esmeralda',
    };

    const getTopProductsPerPOS = (posNumber: number, limit: number) => {
      const posSales = allSales.filter((s) => s.pos_number === posNumber);
      const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

      posSales.forEach((sale: any) => {
        sale.items.forEach((item: any) => {
          const productName = item.product_name || item.name || 'Desconocido';
          const existing = productMap.get(productName) || {
            name: productName,
            quantity: 0,
            revenue: 0,
          };
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal || item.quantity * (item.price || 0);
          productMap.set(productName, existing);
        });
      });

      return Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);
    };

    const getAllTopProducts = (limit: number) => {
      const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

      allSales.forEach((sale: any) => {
        sale.items.forEach((item: any) => {
          const productName = item.product_name || item.name || 'Desconocido';
          const existing = productMap.get(productName) || {
            name: productName,
            quantity: 0,
            revenue: 0,
          };
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal || item.quantity * (item.price || 0);
          productMap.set(productName, existing);
        });
      });

      return Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);
    };

    pdf.setFontSize(18);
    pdf.setFont('', 'bold');
    pdf.text('Reporte de Insights - Sistema de Ventas', margin, yPosition);
    yPosition += 12;

    pdf.setFontSize(10);
    pdf.setFont('', 'normal');
    pdf.text(`Generado: ${new Date().toLocaleString('es-AR')}`, margin, yPosition);
    yPosition += 10;

    addSection('Resumen General');
    addText('Total de Ventas', dashboardData.total_sales.toString(), true);
    addText('Ingresos Totales', `$${dashboardData.total_revenue.toFixed(2)}`, true);
    addText('Items Vendidos', dashboardData.total_items_sold.toString(), true);

    const totalDays = new Set(
      allSales.map((s) => new Date(s.created_at).toDateString())
    ).size;
    const avgDaily = dashboardData.total_revenue / (totalDays || 1);
    addText('Promedio Diario', `$${avgDaily.toFixed(2)}`);

    addSection('Ventas por Negocio');
    for (let posNum = 1; posNum <= 3; posNum++) {
      const posSales = allSales.filter((s) => s.pos_number === posNum);
      if (posSales.length === 0) continue;

      const posTotal = posSales.reduce((sum, s) => sum + s.total, 0);
      const posItems = posSales.reduce((sum, s) => sum + s.items.reduce((isum: number, i: any) => isum + i.quantity, 0), 0);
      const posDays = new Set(
        posSales.map((s) => new Date(s.created_at).toDateString())
      ).size;
      const posAvgDaily = posTotal / (posDays || 1);

      if (yPosition > 240) {
        pdf.addPage();
        yPosition = 10;
      }

      pdf.setFontSize(12);
      pdf.setFont('', 'bold');
      pdf.setTextColor(230, 126, 34);
      pdf.text(`${POS_NAMES[posNum] || `POS ${posNum}`}`, margin + 3, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 6;

      addText('  Ventas', posSales.length.toString());
      addText('  Ingresos', `$${posTotal.toFixed(2)}`);
      addText('  Items', posItems.toString());
      addText('  Promedio Diario', `$${posAvgDaily.toFixed(2)}`);
      yPosition += 2;
    }

    addSection('Ventas por Día (Últimos 200 días)');
    if (salesPerDay.length > 0) {
      pdf.setFontSize(9);
      const columnWidth = (pageWidth - 2 * margin) / 5;
      const tableData = salesPerDay.slice(-30).map((day) => [
        day.date,
        `$${day.total.toFixed(0)}`,
        `$${day.pos1.toFixed(0)}`,
        `$${day.pos2.toFixed(0)}`,
        `$${day.pos3.toFixed(0)}`,
      ]);

      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 10;
      }

      pdf.setFont('', 'bold');
      pdf.text('Fecha', margin, yPosition);
      pdf.text('Total Redes', margin + columnWidth, yPosition);
      pdf.text('Costa del Este', margin + columnWidth * 2, yPosition);
      pdf.text('Mar de las Pampas', margin + columnWidth * 3, yPosition);
      pdf.text('Costa Esmeralda', margin + columnWidth * 4, yPosition);
      yPosition += 5;

      pdf.setFont('', 'normal');
      tableData.forEach((row) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 10;
        }
        pdf.text(row[0], margin, yPosition);
        pdf.text(row[1], margin + columnWidth, yPosition);
        pdf.text(row[2], margin + columnWidth * 2, yPosition);
        pdf.text(row[3], margin + columnWidth * 3, yPosition);
        pdf.text(row[4], margin + columnWidth * 4, yPosition);
        yPosition += 5;
      });
    }

    addSection('Top 20 Productos por Punto de Venta');
    const columnWidth = (pageWidth - 2 * margin) / 3;

    for (let pageIdx = 0; pageIdx < 2; pageIdx++) {
      if (yPosition > 50) {
        pdf.addPage();
        yPosition = 10;
      }

      const posNumbers = pageIdx === 0 ? [1, 2] : [3];

      for (let posNum of posNumbers) {
        const posName = POS_NAMES[posNum] || `POS ${posNum}`;
        const topPosProducts = getTopProductsPerPOS(posNum, 20);

        if (topPosProducts.length === 0) continue;

        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 10;
        }

        pdf.setFontSize(11);
        pdf.setFont('', 'bold');
        pdf.setTextColor(230, 126, 34);
        pdf.text(posName, margin, yPosition);
        pdf.setTextColor(0, 0, 0);
        yPosition += 6;

        pdf.setFontSize(8);
        pdf.setFont('', 'bold');
        pdf.text('Producto', margin, yPosition);
        pdf.text('Cant.', margin + columnWidth * 0.7, yPosition);
        pdf.text('Ingresos', margin + columnWidth * 1.2, yPosition);
        yPosition += 4;

        pdf.setFont('', 'normal');
        topPosProducts.forEach((p: any) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 10;
          }
          const productText = p.name.substring(0, 35);
          pdf.text(productText, margin, yPosition);
          pdf.text(p.quantity.toString(), margin + columnWidth * 0.7, yPosition);
          pdf.text(`$${p.revenue.toFixed(0)}`, margin + columnWidth * 1.2, yPosition);
          yPosition += 4;
        });

        yPosition += 3;
      }
    }

    pdf.save(`insights_${new Date().toISOString().split('T')[0]}.pdf`);
  },
};
