'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { salesService } from '@/lib/services/sales';
import { Sale } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';

export default function SalesHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [exportingProducts, setExportingProducts] = useState(false);
  const [exportFromDate, setExportFromDate] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'pos') {
      router.push('/');
      return;
    }

    const fetchSales = async () => {
      const data = await salesService.getSalesByPos(user.id);
      setSales(data);
      setLoading(false);
    };

    fetchSales();
  }, [user, router]);

  const handleDeleteSale = async () => {
    const CORRECT_PASSWORD = '1004';

    if (deletePassword !== CORRECT_PASSWORD) {
      setDeleteMessage('Contraseña incorrecta');
      return;
    }

    if (!selectedSaleId) return;

    try {
      const success = await salesService.deleteSale(selectedSaleId);
      if (success) {
        setSales(sales.filter((sale) => sale.id !== selectedSaleId));
        setShowDeleteModal(false);
        setSelectedSaleId(null);
        setDeletePassword('');
        setDeleteMessage('');
      } else {
        setDeleteMessage('Error al eliminar la venta');
      }
    } catch {
      setDeleteMessage('Error al eliminar la venta');
    }
  };

  const handleExportProducts = async () => {
    if (!user) return;
    setExportingProducts(true);
    try {
      const productsByCategory = await salesService.getAllProductsSoldByPos(user.id, exportFromDate || undefined);
      
      const workbook = XLSX.utils.book_new();
      
      Object.entries(productsByCategory).forEach(([category, products]) => {
        const dataForExcel = products.map((product) => ({
          'Producto': product.product_name,
          'Cantidad': product.quantity,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        worksheet['!cols'] = [
          { wch: 40 },
          { wch: 12 }
        ];
        
        XLSX.utils.book_append_sheet(workbook, worksheet, category.substring(0, 31));
      });
      
      const fileName = exportFromDate 
        ? `Productos_Vendidos_desde_${exportFromDate}.xlsx`
        : `Productos_Vendidos_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error al exportar:', error);
    } finally {
      setExportingProducts(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Eliminar venta</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Ingresa la contraseña para confirmar</p>
            
            {deleteMessage && (
              <div className={`p-3 rounded-lg mb-4 text-sm font-semibold ${deleteMessage.includes('incorrecta') ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                {deleteMessage}
              </div>
            )}
            
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Ingresa la contraseña"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 text-sm text-black dark:text-white dark:bg-gray-700"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleDeleteSale();
                }
              }}
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleDeleteSale}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
              >
                Eliminar
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSaleId(null);
                  setDeletePassword('');
                  setDeleteMessage('');
                }}
                className="flex-1 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto p-3 sm:p-6">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Historial de ventas</h1>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Exportar ventas desde:</label>
            <input
              type="date"
              value={exportFromDate}
              onChange={(e) => setExportFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-black dark:text-white dark:bg-gray-700"
            />
            <button
              onClick={handleExportProducts}
              disabled={exportingProducts}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold text-sm transition w-full sm:w-auto"
            >
              {exportingProducts ? 'Exportando...' : 'Exportar Excel'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-900 dark:text-gray-100">Cargando historial...</div>
        ) : sales.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center text-gray-600 dark:text-gray-400">
            No hay ventas registradas
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Fecha</th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Items</th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Método</th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Total</th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Detalles</th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm">
                      <div>
                        <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          {new Date(sale.created_at).toLocaleDateString('es-AR')}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">
                          {formatDistanceToNow(new Date(sale.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm">
                      {sale.payment_method ? (
                        <div className="space-y-1">
                          {sale.payment_method === 'Mixto' && sale.payment_breakdown ? (
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              <div>{sale.payment_breakdown.method1} ${sale.payment_breakdown.amount1.toFixed(2)}</div>
                              <div>+ {sale.payment_breakdown.method2} ${sale.payment_breakdown.amount2.toFixed(2)}</div>
                            </div>
                          ) : (
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{sale.payment_method}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Sin datos</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                      ${sale.total.toFixed(2)}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm">
                      <details className="cursor-pointer">
                        <summary className="text-orange-600 dark:text-orange-400 hover:underline text-xs">Ver</summary>
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs py-1 text-gray-900 dark:text-gray-100">
                              <span>
                                {item.product_name} x {item.quantity}
                              </span>
                              <span>${item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm">
                      <button
                        onClick={() => {
                          setSelectedSaleId(sale.id);
                          setShowDeleteModal(true);
                          setDeletePassword('');
                          setDeleteMessage('');
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold transition"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
