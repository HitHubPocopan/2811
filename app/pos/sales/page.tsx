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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
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
                  <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Detalles</th>
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
