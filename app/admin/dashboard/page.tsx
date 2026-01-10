'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { salesService } from '@/lib/services/sales';
import { importExportService } from '@/lib/services/import-export';
import { productService } from '@/lib/services/products';
import { predictionService } from '@/lib/services/prediction';
import { POSDashboardStats, Sale, Product } from '@/lib/types';
import { weatherService, WeatherCondition } from '@/lib/services/weather';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

interface PaymentSalesData {
  name: string;
  value: number;
  [key: string]: string | number;
}

type DateRange = 'today' | '7days' | '30days' | 'month' | 'all';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // State
  const [posStats, setPosStats] = useState<POSDashboardStats[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>('all');
  const [posWeather, setPosWeather] = useState<Record<number, WeatherCondition>>({
    1: 'sunny',
    2: 'sunny',
    3: 'sunny'
  });

  // Fetch real weather for all POS
  useEffect(() => {
    const fetchAllWeather = async () => {
      const results = await Promise.all([
        weatherService.getCurrentWeather(1),
        weatherService.getCurrentWeather(2),
        weatherService.getCurrentWeather(3)
      ]);
      setPosWeather({
        1: results[0],
        2: results[1],
        3: results[2]
      });
    };
    fetchAllWeather();
  }, []);

  const currentForecast = useMemo(() => {
    // 1. Calculate general daily average
    const salesByDay: Record<string, number> = {};
    allSales.forEach(sale => {
      const day = new Date(sale.created_at).toISOString().split('T')[0];
      salesByDay[day] = (salesByDay[day] || 0) + Number(sale.total);
    });
    
    const days = Object.values(salesByDay);
    const globalAverage = days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : 0;

    // 2. Identify current context
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const currentMonth = now.getMonth();

    // 3. Find similar historical days (same day of week in the same month)
    const similarDays: number[] = [];
    Object.entries(salesByDay).forEach(([dateStr, total]) => {
      const d = new Date(dateStr);
      if (d.getDay() === currentDayOfWeek && d.getMonth() === currentMonth) {
        similarDays.push(total);
      }
    });

    const contextAverage = similarDays.length > 0 
      ? similarDays.reduce((a, b) => a + b, 0) / similarDays.length 
      : globalAverage;

    // 4. Calculate realistic boost based on history
    // If we have no history, we'll fall back to a 0 growth baseline instead of "utopian" numbers
    const historicalGrowth = globalAverage > 0 ? ((contextAverage / globalAverage) - 1) * 100 : 0;

    // 5. Get the forecast using the calculated historical growth (using POS 3 as reference for global tip)
    const forecast = predictionService.getForecast(3, posWeather[3], undefined, now);
    
    // Override the "utopian" growth with the historical one
    return {
      ...forecast,
      growth: Math.round(historicalGrowth)
    };
  }, [allSales, posWeather]);

  // Commissions (editable in a real app, but for now we'll use defaults)
  const COMMISSIONS = useMemo(() => ({
    'Efectivo': 0,
    'Transferencia': 0,
    'QR': 0.008,
    'Débito': 0.015,
    'Crédito': 0.035,
    'Mixto': 0.01
  }), []);

  // Data Fetching
  const fetchStats = useCallback(async () => {
    const [sales, products] = await Promise.all([
      salesService.getAllSales(10000),
      productService.getAll()
    ]);
    
    setAllSales(sales);
    setLowStockProducts(products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock));

    const posDataArray = [];
    for (let i = 1; i <= 3; i++) {
      const posData = await salesService.getPosDashboard(``, i);
      if (posData) posDataArray.push(posData);
    }
    setPosStats(posDataArray);

    try {
      const expensesResponse = await fetch('/api/egresos');
      if (expensesResponse.ok) {
        const expenses = await expensesResponse.json();
        const total = Array.isArray(expenses) ? expenses.reduce((sum, exp) => sum + (exp.total || 0), 0) : 0;
        setTotalExpenses(total);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchStats(); // eslint-disable-line react-hooks/set-state-in-effect

    const channel = supabase
      .channel('admin_dashboard_realtime')
      .on('postgres_changes', { event: 'INSERT', table: 'sales', schema: 'public' }, (payload) => {
        setAllSales(prev => [payload.new as Sale, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, router, fetchStats]);

  // Helpers
  const getSalesByPaymentMethod = useCallback((sales: Sale[]): PaymentSalesData[] => {
    const paymentSales: Record<string, number> = {};
    sales.forEach((sale) => {
      const method = sale.payment_method || 'Desconocido';
      paymentSales[method] = (paymentSales[method] || 0) + Number(sale.total);
    });
    return Object.entries(paymentSales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const getSalesByHour = useCallback((sales: Sale[]): { hour: string; total: number }[] => {
    const hourlyData: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourlyData[i] = 0;

    sales.forEach(sale => {
      const date = new Date(sale.created_at);
      const hour = date.getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + Number(sale.total);
    });

    return Object.entries(hourlyData).map(([hour, total]) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      total
    }));
  }, []);

  const getSalesByDayOfWeek = useCallback((sales: Sale[]): { day: string; total: number }[] => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dailyData: Record<number, number> = {};
    [0, 1, 2, 3, 4, 5, 6].forEach(d => dailyData[d] = 0);

    sales.forEach(sale => {
      const date = new Date(sale.created_at);
      const day = date.getDay();
      dailyData[day] += Number(sale.total);
    });

    return [1, 2, 3, 4, 5, 6, 0].map(dayIndex => ({
      day: dayNames[dayIndex],
      total: dailyData[dayIndex]
    }));
  }, []);

  // Filtered Data
  const { filteredSales, previousSales } = useMemo(() => {
    if (selectedRange === 'all') return { filteredSales: allSales, previousSales: [] };
    
    const now = new Date();
    const start = new Date();
    const prevStart = new Date();
    const prevEnd = new Date();
    
    if (selectedRange === 'today') {
      start.setHours(0, 0, 0, 0);
      prevStart.setDate(now.getDate() - 1);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(now.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
    } else if (selectedRange === '7days') {
      start.setDate(now.getDate() - 7);
      prevStart.setDate(now.getDate() - 14);
      prevEnd.setDate(now.getDate() - 7);
    } else if (selectedRange === '30days') {
      start.setDate(now.getDate() - 30);
      prevStart.setDate(now.getDate() - 60);
      prevEnd.setDate(now.getDate() - 30);
    } else if (selectedRange === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      prevStart.setMonth(now.getMonth() - 1);
      prevStart.setDate(1);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(0);
      prevEnd.setHours(23, 59, 59, 999);
    }
    
    return {
      filteredSales: allSales.filter(sale => new Date(sale.created_at) >= start),
      previousSales: allSales.filter(sale => {
        const d = new Date(sale.created_at);
        return d >= prevStart && d < prevEnd;
      })
    };
  }, [allSales, selectedRange]);

  const filteredStats = useMemo(() => {
    const calculateStats = (sales: Sale[]) => {
      const total_sales = sales.length;
      const total_revenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
      const total_commissions = sales.reduce((sum, s) => {
        const method = s.payment_method || 'Efectivo';
        return sum + (Number(s.total) * (COMMISSIONS[method as keyof typeof COMMISSIONS] || 0));
      }, 0);
      
      const itemCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
      sales.forEach((sale) => {
        sale.items.forEach((item) => {
          if (!itemCounts[item.product_id]) {
            itemCounts[item.product_id] = { name: item.product_name, quantity: 0, revenue: 0 };
          }
          itemCounts[item.product_id].quantity += item.quantity;
          itemCounts[item.product_id].revenue += item.subtotal;
        });
      });

      const sortedProducts = Object.values(itemCounts).sort((a, b) => b.quantity - a.quantity);
      const top_products = sortedProducts.slice(0, 100).map((p) => ({ product_name: p.name, quantity: p.quantity, revenue: p.revenue }));
      const low_rotation = Object.values(itemCounts).sort((a, b) => a.quantity - b.quantity).slice(0, 100);

      const total_items_sold = Object.values(itemCounts).reduce((sum, item) => sum + item.quantity, 0);

      return { total_sales, total_revenue, total_items_sold, top_products, low_rotation, total_commissions };
    };

    const current = calculateStats(filteredSales);
    const previous = calculateStats(previousSales);

    return { ...current, previous };
  }, [filteredSales, previousSales, COMMISSIONS]);

  const averageTicket = useMemo(() => {
    return filteredSales.length > 0 ? filteredStats.total_revenue / filteredSales.length : 0;
  }, [filteredSales, filteredStats]);

  const hourlySales = useMemo(() => getSalesByHour(filteredSales), [filteredSales, getSalesByHour]);
  const weeklySales = useMemo(() => getSalesByDayOfWeek(filteredSales), [filteredSales, getSalesByDayOfWeek]);
  const salesByPayment = useMemo(() => getSalesByPaymentMethod(filteredSales), [filteredSales, getSalesByPaymentMethod]);

  const inflectionPoints = useMemo(() => {
    const today = new Date().getDate();
    const points = [1, 7, 8, 14, 15, 21, 22, 30];
    return points.includes(today);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredSales.map(sale => ({
      ID: sale.id,
      Fecha: new Date(sale.created_at).toLocaleString(),
      POS: sale.pos_number,
      Total: sale.total,
      Metodo_Pago: sale.payment_method,
      Items: sale.items.map(i => `${i.product_name} (x${i.quantity})`).join(', ')
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, `Reporte_Ventas_${selectedRange}.xlsx`);
  };

  const handleExportPDF = async () => {
    if (!filteredStats) return;
    setExporting(true);
    try {
      await importExportService.exportInsightsToPDF(filteredStats, filteredSales, []);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    }
    setExporting(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 font-light selection:bg-orange-100">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 lg:p-10 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-[0.2em]">SISTEMA DE CONTROL CENTRAL</span>
            </div>
            <h1 className="text-5xl font-extralight text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-2 max-w-md">Análisis predictivo y consolidación de ventas en red para administradores.</p>
            
            {/* Predictive & External Factors */}
            <div className="mt-6 flex flex-wrap gap-4">
              {/* Seasonality Factor */}
              <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 transition-all ${(new Date().getMonth() === 0 || new Date().getMonth() === 1) ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50'}`}>
                <span className="text-xl">☀️</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Temporada Alta</p>
                  <p className="text-xs font-medium">{(new Date().getMonth() === 0 || new Date().getMonth() === 1) ? 'Mes Pico: Enero/Febrero - Demanda Máxima.' : 'Fuera de temporada estival.'}</p>
                </div>
              </div>

              {/* Day & Flow Factor */}
              <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm">
                <span className="text-xl">📊</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Recambio Turístico</p>
                  <p className="text-xs font-medium capitalize">
                    {(() => {
                      const flow = predictionService.getTouristFlow();
                      if (flow === 'arrival') return '🟢 Ingreso de Turistas';
                      if (flow === 'departure') return '🔴 Egreso de Turistas';
                      if (flow === 'high' || flow === 'medium') return '🔵 Fin de Semana / Flujo Alto';
                      return '⚪ Flujo Estándar';
                    })()}
                  </p>
                </div>
              </div>

              {/* Auto Weather Factor - Show for all POS */}
              <div className="flex bg-white border border-slate-200 rounded-2xl shadow-sm divide-x divide-slate-100">
                {[1, 2, 3].map((pos) => (
                  <div key={pos} className="px-4 py-2 flex items-center gap-3">
                    <span className="text-xl">
                      {posWeather[pos] === 'sunny' ? '☀️' : posWeather[pos] === 'cloudy' ? '☁️' : '🌧️'}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest">POS {pos}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {posWeather[pos] === 'sunny' ? 'Despejado' : posWeather[pos] === 'cloudy' ? 'Nublado' : 'Lluvia'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inflection Point */}
              <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 transition-all ${inflectionPoints ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50'}`}>
                <span className="text-xl">{inflectionPoints ? '⚠️' : '✅'}</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Ciclo Financiero</p>
                  <p className="text-xs font-medium">{inflectionPoints ? 'Punto de Inflexión: Alta fluctuación.' : 'Periodo de estabilidad.'}</p>
                </div>
              </div>

              {/* Estimated Growth Badge */}
              <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 animate-pulse ${currentForecast.growth >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                <span className="text-xl">{currentForecast.growth >= 0 ? '🚀' : '📉'}</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Performance Histórica</p>
                  <p className="text-xs font-medium">{currentForecast.growth >= 0 ? '+' : ''}{currentForecast.growth}% vs promedio base</p>
                </div>
              </div>

              {/* Recommendation Tooltip */}
              <div className="px-4 py-2 rounded-2xl bg-orange-600 text-white flex items-center gap-3 shadow-lg shadow-orange-200">
                <span className="text-xl">💡</span>
                <p className="text-xs font-bold tracking-tight">{currentForecast.tip}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl flex gap-1 border border-slate-200 shadow-sm">
              {(['today', '7days', '30days', 'month', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedRange === range 
                      ? 'bg-orange-600 text-white shadow-lg' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {range === 'today' ? 'Hoy' : range === '7days' ? '7D' : range === '30days' ? '30D' : range === 'month' ? 'Mes' : 'Todo'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleRefresh} disabled={refreshing} className="bg-white border border-slate-200 hover:border-slate-300 p-2.5 rounded-xl transition-all disabled:opacity-50 group">
                <span className={`block transform transition-transform duration-700 ${refreshing ? 'rotate-180' : 'group-hover:rotate-12'}`}>🔄</span>
              </button>
              <button onClick={handleExportCSV} className="bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 px-5 py-2.5 rounded-xl transition-all text-sm font-medium tracking-wide">
                EXPORTAR CSV
              </button>
              <button onClick={handleExportPDF} disabled={exporting} className="bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white border border-orange-200 px-5 py-2.5 rounded-xl transition-all text-sm font-medium tracking-wide">
                {exporting ? 'GENERANDO...' : 'PDF'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-32 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-t-2 border-orange-600 border-solid rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-t-2 border-orange-400 border-solid rounded-full animate-ping opacity-20"></div>
            </div>
            <span className="text-slate-400 text-xs tracking-widest font-medium uppercase">Sincronizando base de datos...</span>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            {/* Main KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard 
                title="Ventas Totales" 
                value={filteredStats.total_sales} 
                icon="📊" 
                color="bg-blue-50 text-blue-600 bg-blue-500" 
                comparison={filteredStats.previous.total_sales}
              />
              <StatCard 
                title="Ingresos Brutos" 
                value={`$${filteredStats.total_revenue.toLocaleString()}`} 
                icon="💰" 
                color="bg-emerald-50 text-emerald-600 bg-emerald-500" 
                comparison={filteredStats.previous.total_revenue}
              />
              <StatCard 
                title="Utilidad Estimada (Neto)" 
                value={`$${(filteredStats.total_revenue - filteredStats.total_commissions).toLocaleString()}`} 
                icon="🏦" 
                color="bg-indigo-50 text-indigo-600 bg-indigo-500" 
                comparison={filteredStats.previous.total_revenue - filteredStats.previous.total_commissions}
              />
              <StatCard 
                title="Pérdida Comisiones" 
                value={`-$${filteredStats.total_commissions.toLocaleString()}`} 
                icon="💸" 
                color="bg-rose-50 text-rose-600 bg-rose-500" 
                comparison={filteredStats.previous.total_commissions}
                reverseColors
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <StatCard title="Ticket Promedio" value={`$${averageTicket.toFixed(2)}`} icon="🎟️" color="bg-amber-50 text-amber-600 bg-amber-500" />
              <StatCard title="Items Vendidos" value={filteredStats.total_items_sold} icon="📦" color="bg-purple-50 text-purple-600 bg-purple-500" />
              <StatCard title="Total Egresos" value={`$${totalExpenses.toLocaleString()}`} icon="📉" color="bg-rose-50 text-rose-600 bg-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sales Distribution Area Chart */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-xl font-extralight text-slate-900 tracking-tight">Carga por Hora</h2>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">24 Horas</span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={hourlySales}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#f97316' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#f97316" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly Heatmap (Bar Chart) */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-xl font-extralight text-slate-900 tracking-tight">Rendimiento Semanal</h2>
                    <p className="text-xs text-slate-400 mt-1">Identifica días para refuerzo de stock y personal</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Lun - Dom</span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Critical Inventory Section */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
                <h2 className="text-xl font-extralight text-slate-900 tracking-tight mb-8">Stock Crítico (Bajo)</h2>
                <div className="space-y-4 flex-1">
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.slice(0, 5).map(product => (
                      <div key={product.id} className="group flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800 truncate max-w-[140px]">{product.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{product.category || 'General'}</span>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-light ${product.stock === 0 ? 'text-rose-600' : 'text-amber-600'}`}>{product.stock}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-tighter">UNIDADES</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-30 grayscale">
                      <span className="text-4xl mb-4">✅</span>
                      <p className="text-xs text-slate-400 uppercase tracking-widest">Inventario Óptimo</p>
                    </div>
                  )}
                </div>
                <Link href="/admin/products" className="mt-8 text-center text-xs font-bold text-orange-600 hover:text-orange-700 tracking-widest uppercase transition-all">
                  Gestionar Inventario →
                </Link>
              </div>

              {/* Low Rotation Products (Scrollable) */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-[400px]">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-extralight text-slate-900 tracking-tight">Baja Rotación</h2>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Menos vendidos</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4 font-bold">Producto</th>
                        <th className="pb-4 font-bold text-right">Ventas</th>
                        <th className="pb-4 font-bold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStats.low_rotation.map((product, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4">
                            <span className="text-xs font-medium text-slate-700 block truncate max-w-[180px]">
                              {product.name}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-right font-medium text-slate-500">
                            {product.quantity}
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">LIQUIDAR?</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* POS Management Section */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <h2 className="text-xl font-extralight text-slate-900 tracking-tight mb-8">Puntos de Venta Activos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 max-h-[400px]">
                  {posStats.map((pos) => (
                    <Link 
                      key={pos.pos_number} 
                      href={`/admin/pos/${pos.pos_number}`}
                      className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-500/30 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg font-bold">
                          {pos.pos_number}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-slate-100">
                          ONLINE
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-800">{pos.pos_name || `Caja ${pos.pos_number}`}</h3>
                        <p className="text-xs text-slate-500 mt-1">${pos.total_revenue.toLocaleString()} en ventas</p>
                      </div>
                      <div className="mt-4 flex items-center text-[10px] font-bold text-orange-600 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                        VER DASHBOARD →
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Top 100 Products per POS (Scrollable) */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-extralight text-slate-900 tracking-tight">Ranking Extendido (Top 100)</h2>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global por Cantidad</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">
                          <th className="pb-4 font-bold">Pos</th>
                          <th className="pb-4 font-bold">Producto</th>
                          <th className="pb-4 font-bold text-right">Cant.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredStats.top_products.slice(0, 100).map((product, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-3 text-xs font-medium text-slate-400">#{idx + 1}</td>
                            <td className="py-3">
                              <span className="text-xs font-medium text-slate-700 block truncate max-w-[180px]">
                                {product.product_name}
                              </span>
                            </td>
                            <td className="py-3 text-xs text-right font-medium text-orange-600">
                              {product.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Mix Pie Chart Section (Moved down) */}
            <div className="grid grid-cols-1 gap-8">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-xl font-extralight text-slate-900 tracking-tight">Mix de Pagos Consolidado</h2>
                  {filteredStats.total_commissions > (filteredStats.total_revenue * 0.02) && (
                    <div className="animate-bounce bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-bold border border-rose-100">
                      ⚠️ ALTA PÉRDIDA POR COMISIONES
                    </div>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesByPayment}
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {salesByPayment.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                      formatter={(value: number, name: string) => {
                        const commission = COMMISSIONS[name as keyof typeof COMMISSIONS] || 0;
                        const loss = value * commission;
                        return [`$${value.toLocaleString()}`, `Pérdida: -$${loss.toLocaleString()} (${(commission * 100).toFixed(1)}%)`];
                      }}
                    />
                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, comparison, reverseColors }: { 
  title: string; 
  value: string | number; 
  icon: string; 
  color: string; 
  comparison?: number;
  reverseColors?: boolean;
}) {
  const percentage = useMemo(() => {
    if (comparison === undefined || comparison === 0) return null;
    const current = typeof value === 'string' ? Number(value.replace(/[^0-9.-]+/g, "")) : value;
    const diff = ((current - comparison) / comparison) * 100;
    return diff;
  }, [value, comparison]);

  const isPositive = percentage !== null && percentage > 0;
  const showGreen = reverseColors ? !isPositive : isPositive;

  return (
    <div className={`relative overflow-hidden bg-white p-8 rounded-3xl border border-slate-200 group hover:border-orange-500/20 transition-all duration-500 shadow-sm`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${color.split(' ')[2]}`}></div>
      <div className="relative z-10 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</span>
          {percentage !== null && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${showGreen ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(percentage).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-extralight text-slate-900 tracking-tighter">{value}</h3>
          <div className={`w-10 h-10 rounded-xl ${color.split(' ')[0]} flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all duration-700`}>
            {icon}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -right-6 text-8xl opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
        {icon}
      </div>
    </div>
  );
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#6366f1'];
