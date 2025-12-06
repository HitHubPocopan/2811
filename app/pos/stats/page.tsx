'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { salesService } from '@/lib/services/sales';
import { POSDashboardStats } from '@/lib/types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StatsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<POSDashboardStats | null>(null);
  const [salesPerDay, setSalesPerDay] = useState<Array<{ date: string; total: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'pos') {
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      const data = await salesService.getPosDashboard(user.id, user.pos_number || 0);
      const perDay = await salesService.getSalesByDayAndPos(user.pos_number || 0, 200);
      setStats(data);
      setSalesPerDay(perDay);
      setLoading(false);
    };

    fetchStats();
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Estadísticas - {user.name || `POS ${user.pos_number}`}</h1>

        {loading ? (
          <div className="text-center py-12">Cargando estadísticas...</div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm font-semibold mb-2">Total de ventas</p>
                <p className="text-4xl font-bold text-orange-600">{stats.total_sales}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm font-semibold mb-2">Ingresos totales</p>
                <p className="text-4xl font-bold text-green-600">${stats.total_revenue.toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm font-semibold mb-2">Items vendidos</p>
                <p className="text-4xl font-bold text-purple-600">{stats.total_items_sold}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Productos más vendidos</h2>
              {stats.top_products.length === 0 ? (
                <p className="text-gray-600">No hay datos disponibles</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.top_products}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" fill="#f97316" name="Cantidad" />
                    <Bar dataKey="revenue" fill="#10b981" name="Ingresos" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Ventas por Día (últimos 200 días)</h2>
              {salesPerDay.length === 0 ? (
                <p className="text-gray-600">No hay datos disponibles</p>
              ) : (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesPerDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#f97316" name="Ventas del Día" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Vendido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesPerDay.slice().reverse().map((day, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {new Date(day.date + 'T03:00:00').toLocaleDateString('es-AR', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-orange-600">${day.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Últimas ventas</h2>
              {stats.last_sales.length === 0 ? (
                <p className="text-gray-600">No hay ventas registradas</p>
              ) : (
                <div className="space-y-3">
                  {stats.last_sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-semibold">
                          {new Date(sale.created_at).toLocaleDateString('es-AR')} -{' '}
                          {new Date(sale.created_at).toLocaleTimeString('es-AR')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {sale.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </p>
                      </div>
                      <p className="font-bold text-green-600">${sale.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">Error al cargar estadísticas</div>
        )}
      </div>
    </div>
  );
}
