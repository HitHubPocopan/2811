'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { salesService } from '@/lib/services/sales';
import { DashboardStats, POSDashboardStats } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [posStats, setPosStats] = useState<POSDashboardStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      const adminData = await salesService.getAdminDashboard();
      setStats(adminData);

      const posDataArray = [];
      for (let i = 1; i <= 3; i++) {
        const posData = await salesService.getPosDashboard(``, i);
        if (posData) posDataArray.push(posData);
      }
      setPosStats(posDataArray);

      setLoading(false);
    };

    fetchStats();
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-2">Visión consolidada de todos los puntos de venta</p>
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
                    <p className="text-gray-600 text-sm font-medium mb-1">Total de ventas</p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos más vendidos (Red consolidada)</h2>
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

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Puntos de Venta</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {posStats.map((pos) => (
                  <Link key={pos.pos_number} href={`/admin/pos/${pos.pos_number}`}>
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer p-6 h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-orange-100 rounded-lg p-3">
                          <span className="text-2xl">🏪</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{pos.pos_name}</h3>
                          <p className="text-gray-600 text-sm">Punto de Venta</p>
                        </div>
                      </div>
                      <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2 px-4 rounded-lg hover:shadow-lg transition-shadow">
                        Ver Detalles →
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Top 15 Productos más vendidos</h2>
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
                      {stats.top_products.slice(0, 15).map((product, idx) => (
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
          </div>
        ) : (
          <div className="flex justify-center items-center py-20">
            <p className="text-gray-600 text-lg">Error al cargar datos</p>
          </div>
        )}
      </div>
    </div>
  );
}
