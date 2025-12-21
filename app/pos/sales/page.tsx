'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { salesService } from '@/lib/services/sales';
import { Sale } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SalesHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar venta</h3>
            <p className="text-gray-600 mb-4">Ingresa la contraseña para confirmar</p>
            
            {deleteMessage && (
              <div className={`p-3 rounded-lg mb-4 text-sm font-semibold ${deleteMessage.includes('incorrecta') ? 'bg-red-50 text-red-700' : 'bg-red-50 text-red-700'}`}>
                {deleteMessage}
              </div>
            )}
            
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Ingresa la contraseña"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 text-sm text-black"
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
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Historial de ventas</h1>

        {loading ? (
          <div className="text-center py-12">Cargando historial...</div>
        ) : sales.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-600">
            No hay ventas registradas
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Fecha</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cantidad items</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Método de pago</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Detalles</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="font-semibold">
                          {new Date(sale.created_at).toLocaleDateString('es-AR')}
                        </p>
                        <p className="text-gray-600 text-xs">
                          {formatDistanceToNow(new Date(sale.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {sale.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {sale.payment_method ? (
                        <div className="space-y-1">
                          {sale.payment_method === 'Mixto' && sale.payment_breakdown ? (
                            <div className="text-xs font-semibold text-gray-700">
                              <div>{sale.payment_breakdown.method1} ${sale.payment_breakdown.amount1.toFixed(2)}</div>
                              <div>+ {sale.payment_breakdown.method2} ${sale.payment_breakdown.amount2.toFixed(2)}</div>
                            </div>
                          ) : (
                            <span className="font-semibold text-gray-900">{sale.payment_method}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin datos</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      ${sale.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <details className="cursor-pointer">
                        <summary className="text-orange-600 hover:underline">Ver</summary>
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm py-1">
                              <span>
                                {item.product_name} x {item.quantity}
                              </span>
                              <span>${item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          setSelectedSaleId(sale.id);
                          setShowDeleteModal(true);
                          setDeletePassword('');
                          setDeleteMessage('');
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold transition"
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
