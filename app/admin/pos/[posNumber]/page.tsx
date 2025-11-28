'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { salesService } from '@/lib/services/sales';
import { POSDashboardStats } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function POSDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<POSDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const posNumber = parseInt(params.posNumber as string);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      const data = await salesService.getPosDashboard('', posNumber);
      setStats(data);
      setLoading(false);
    };

    fetchStats();
  }, [user, router, posNumber]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-2">
            ← Volver
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{stats?.pos_name || `Punto de Venta ${posNumber}`}</h1>
            <p className="text-gray-600 mt-2">Detalles y estadísticas</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : stats ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">Ventas realizadas</p>
                    <p className="text-4xl font-bold text-gray-900">{stats.total_sales}</p>
                  </div>
                  <div className="text-5xl text-orange-100">📊</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">Ingresos totales</p>
                    <p className="text-4xl font-bold text-gray-900">${stats.total_revenue.toFixed(2)}</p>
                  </div>
                  <div className="text-5xl text-green-100">💰</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">Items vendidos</p>
                    <p className="text-4xl font-bold text-gray-900">{stats.total_items_sold}</p>
                  </div>
                  <div className="text-5xl text-purple-100">📦</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos más vendidos - {stats.pos_name}</h2>
              {stats.top_products.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No hay datos disponibles</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={stats.top_products} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="quantity" fill="#f97316" name="Cantidad" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="revenue" fill="#10b981" name="Ingresos" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Top 10 Productos más vendidos</h2>
              {stats.top_products.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No hay datos disponibles</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Producto</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cantidad</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top_products.slice(0, 10).map((product, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.product_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">
                              {product.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-green-600">${product.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {stats.last_sales.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Últimas ventas</h2>
                <div className="space-y-4">
                  {stats.last_sales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-lg border border-orange-100">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {new Date(sale.created_at).toLocaleDateString('es-AR')} - {new Date(sale.created_at).toLocaleTimeString('es-AR')}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {sale.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">${sale.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center py-20">
            <p className="text-gray-600 text-lg">POS no encontrado o sin datos</p>
          </div>
        )}
      </div>
    </div>
  );
}
