'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { salesService } from '@/lib/services/sales';
import { importExportService } from '@/lib/services/import-export';
import { DashboardStats, POSDashboardStats, Sale } from '@/lib/types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PaymentSalesData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [posStats, setPosStats] = useState<POSDashboardStats[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [salesPerDay, setSalesPerDay] = useState<Array<{ date: string; total: number; pos1: number; pos2: number; pos3: number }>>([]);
  const [salesByPayment, setSalesByPayment] = useState<PaymentSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getSalesByPaymentMethod = (sales: Sale[]): PaymentSalesData[] => {
    const paymentSales: Record<string, number> = {};

    sales.forEach((sale) => {
      const method = sale.payment_method || 'Desconocido';
      if (!paymentSales[method]) {
        paymentSales[method] = 0;
      }
      paymentSales[method] += sale.total;
    });

    return Object.entries(paymentSales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const fetchStats = async () => {
    const adminData = await salesService.getAdminDashboard();
    const sales = await salesService.getAllSales();
    const perDay = await salesService.getSalesPerDay(200);
    
    setStats(adminData);
    setAllSales(sales);
    setSalesPerDay(perDay);
    setSalesByPayment(getSalesByPaymentMethod(sales));

    const posDataArray = [];
    for (let i = 1; i <= 3; i++) {
      const posData = await salesService.getPosDashboard(``, i);
      if (posData) posDataArray.push(posData);
    }
    setPosStats(posDataArray);

    setLoading(false);
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchStats();
  }, [user, router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleExportPDF = async () => {
    if (!stats) return;
    setExporting(true);
    try {
      await importExportService.exportInsightsToPDF(stats, allSales, salesPerDay);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    }
    setExporting(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="mb-8 flex justify-between items-start gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard Administrativo</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Visión consolidada de todos los puntos de venta</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting || !stats}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Generando...' : 'Exportar PDF'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : stats ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total de ventas</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats.total_sales}</p>
                  </div>
                  <div className="text-5xl text-orange-100">📊</div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Ingresos totales</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">${stats.total_revenue.toFixed(2)}</p>
                  </div>
                  <div className="text-5xl text-green-100">💰</div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Items vendidos</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats.total_items_sold}</p>
                  </div>
                  <div className="text-5xl text-purple-100">📦</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ventas por Método de Pago (Unificado)</h2>
                {salesByPayment.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">No hay datos disponibles</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={salesByPayment}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#f97316" />
                        <Cell fill="#10b981" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#ec4899" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Productos más vendidos (Red consolidada)</h2>
                {stats.top_products.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">No hay datos disponibles</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.top_products.slice(0, 8)} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={100} stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', backgroundColor: '#f3f4f6' }} />
                      <Legend />
                      <Bar dataKey="quantity" fill="#f97316" name="Cantidad" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="revenue" fill="#10b981" name="Ingresos" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Puntos de Venta</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {posStats.map((pos) => (
                  <Link key={pos.pos_number} href={`/admin/pos/${pos.pos_number}`}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer p-6 h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-orange-100 dark:bg-orange-900 rounded-lg p-3">
                          <span className="text-2xl">🏪</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{pos.pos_name}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Punto de Venta</p>
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

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ventas por Día (últimos 200 días)</h2>
              {salesPerDay.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No hay datos disponibles</p>
              ) : (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={salesPerDay} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', backgroundColor: '#f3f4f6' }} />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#f97316" name="Total Redes" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="pos1" stroke="#3b82f6" name="Costa del Este" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="pos2" stroke="#10b981" name="Mar de las Pampas" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="pos3" stroke="#f43f5e" name="Costa Esmeralda" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Fecha</th>
                          <th className="px-4 py-3 text-right font-semibold text-blue-700 dark:text-blue-300">Total Redes</th>
                          <th className="px-4 py-3 text-right font-semibold text-blue-700 dark:text-blue-300">Costa del Este</th>
                          <th className="px-4 py-3 text-right font-semibold text-green-700 dark:text-green-300">Mar de las Pampas</th>
                          <th className="px-4 py-3 text-right font-semibold text-rose-700 dark:text-rose-300">Costa Esmeralda</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesPerDay.slice().reverse().map((day, idx) => (
                          <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                              {new Date(day.date + 'T03:00:00').toLocaleDateString('es-AR', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-orange-600 dark:text-orange-400">${day.total.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">${day.pos1.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">${day.pos2.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">${day.pos3.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Top 15 Productos más vendidos</h2>
              {stats.top_products.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No hay datos disponibles</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Producto</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Cantidad</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top_products.slice(0, 15).map((product, idx) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{product.product_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-xs font-semibold">
                              {product.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-green-600 dark:text-green-400">${product.revenue.toFixed(2)}</td>
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
