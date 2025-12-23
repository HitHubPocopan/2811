'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { salesService } from '@/lib/services/sales';
import { POSDashboardStats, Sale } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HourlyData {
  hour: string;
  total: number;
  percentage: number;
  sales_count: number;
}

interface DayWeatherDetail {
  date: string;
  morning: string;
  afternoon: string;
  evening: string;
  summary: string;
  hasVariation: boolean;
}

const LOCATION_COORDINATES: Record<number, { lat: number; lon: number }> = {
  1: { lat: -34.5371, lon: -56.4237 },
  2: { lat: -36.7961, lon: -56.8997 },
  3: { lat: -36.5275, lon: -56.7586 },
};

const WEATHER_CODES: Record<number, string> = {
  0: 'Despejado',
  1: 'Parcialmente nublado',
  2: 'Nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina',
  51: 'Lluvia ligera',
  53: 'Lluvia',
  55: 'Lluvia fuerte',
  61: 'Lluvia',
  63: 'Lluvia',
  65: 'Lluvia fuerte',
  80: 'Lluvia',
  81: 'Lluvia',
  82: 'Lluvia fuerte',
};

async function fetchHourlyWeather(latitude: number, longitude: number, days: number = 200) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = new Date().toISOString().split('T')[0];

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startStr}&end_date=${endStr}&hourly=weather_code,precipitation&timezone=America/Argentina/Buenos_Aires`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API error');
    
    const data = await response.json();
    return {
      times: data.hourly.time,
      codes: data.hourly.weather_code,
      precipitation: data.hourly.precipitation
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

function getWeatherSummaryForDay(times: string[], codes: number[], precipitation: number[], date: string): DayWeatherDetail {
  const dayStart = new Date(date);
  const dayEnd = new Date(date);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const dayIndices = times
    .map((time, idx) => {
      const t = new Date(time);
      return t >= dayStart && t < dayEnd ? idx : -1;
    })
    .filter(idx => idx !== -1);

  if (dayIndices.length === 0) {
    return {
      date,
      morning: 'N/D',
      afternoon: 'N/D',
      evening: 'N/D',
      summary: 'Sin datos',
      hasVariation: false
    };
  }

  const getMostCommonWeather = (indices: number[]) => {
    const codes_in_range = indices.map(i => codes[i] || 0);
    const hasRain = indices.some(i => precipitation[i] > 0.1);
    
    if (hasRain) return 'Lluvia';
    const mostCommon = codes_in_range[0];
    return WEATHER_CODES[mostCommon] || 'Desconocido';
  };

  const morningIndices = dayIndices.filter(idx => {
    const h = new Date(times[idx]).getHours();
    return h >= 6 && h < 12;
  });

  const afternoonIndices = dayIndices.filter(idx => {
    const h = new Date(times[idx]).getHours();
    return h >= 12 && h < 18;
  });

  const eveningIndices = dayIndices.filter(idx => {
    const h = new Date(times[idx]).getHours();
    return h >= 18 || h < 6;
  });

  const morning = morningIndices.length > 0 ? getMostCommonWeather(morningIndices) : 'N/D';
  const afternoon = afternoonIndices.length > 0 ? getMostCommonWeather(afternoonIndices) : 'N/D';
  const evening = eveningIndices.length > 0 ? getMostCommonWeather(eveningIndices) : 'N/D';

  const conditions = [morning, afternoon, evening].filter(c => c !== 'N/D');
  const hasVariation = new Set(conditions).size > 1;
  
  const summary = hasVariation 
    ? `Mañana: ${morning}, Tarde: ${afternoon}, Noche: ${evening}`
    : morning;

  return {
    date,
    morning,
    afternoon,
    evening,
    summary,
    hasVariation
  };
}

async function getWeatherByPos(posNumber: number, days: number = 200): Promise<Record<string, DayWeatherDetail>> {
  const coords = LOCATION_COORDINATES[posNumber];
  if (!coords) return {};

  const weatherData = await fetchHourlyWeather(coords.lat, coords.lon, days);
  if (!weatherData) return {};

  const result: Record<string, DayWeatherDetail> = {};
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    
    result[dateStr] = getWeatherSummaryForDay(
      weatherData.times,
      weatherData.codes,
      weatherData.precipitation,
      dateStr
    );
  }

  return result;
}

export default function StatsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<POSDashboardStats | null>(null);
  const [salesPerDay, setSalesPerDay] = useState<Array<{ date: string; total: number }>>([]);
  const [salesPerHour, setSalesPerHour] = useState<HourlyData[]>([]);
  const [weatherByDate, setWeatherByDate] = useState<Record<string, DayWeatherDetail>>({});
  const [loading, setLoading] = useState(true);

  const getSalesPerHour = async (posNumber: number, days = 30) => {
    try {
      const now = new Date();
      const argentinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
      const startDate = new Date(argentinaTime);
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(3, 0, 0, 0);

      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .eq('pos_number', posNumber)
        .gte('created_at', startDate.toISOString());

      if (error || !sales) {
        return [];
      }

      const shiftData = {
        manana: { total: 0, count: 0 },
        mediodia: { total: 0, count: 0 },
        tarde: { total: 0, count: 0 },
        noche: { total: 0, count: 0 },
      };
      let grandTotal = 0;

      sales.forEach((sale: Sale) => {
        const saleDate = new Date(sale.created_at);
        const saleDateArg = new Date(saleDate.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
        const hour = saleDateArg.getHours();
        
        if (hour >= 2 && hour < 9) {
          return;
        }
        
        if (hour >= 9 && hour < 12) {
          shiftData.manana.total += sale.total;
          shiftData.manana.count += 1;
        } else if (hour >= 12 && hour < 16) {
          shiftData.mediodia.total += sale.total;
          shiftData.mediodia.count += 1;
        } else if (hour >= 16 && hour < 20) {
          shiftData.tarde.total += sale.total;
          shiftData.tarde.count += 1;
        } else {
          shiftData.noche.total += sale.total;
          shiftData.noche.count += 1;
        }
        
        grandTotal += sale.total;
      });

      const result: HourlyData[] = [
        {
          hour: 'Mañana (09:00 - 12:00)',
          total: shiftData.manana.total,
          percentage: grandTotal > 0 ? (shiftData.manana.total / grandTotal) * 100 : 0,
          sales_count: shiftData.manana.count,
        },
        {
          hour: 'Medio día (12:00 - 16:00)',
          total: shiftData.mediodia.total,
          percentage: grandTotal > 0 ? (shiftData.mediodia.total / grandTotal) * 100 : 0,
          sales_count: shiftData.mediodia.count,
        },
        {
          hour: 'Tarde (16:00 - 20:00)',
          total: shiftData.tarde.total,
          percentage: grandTotal > 0 ? (shiftData.tarde.total / grandTotal) * 100 : 0,
          sales_count: shiftData.tarde.count,
        },
        {
          hour: 'Noche (20:00 - 02:00)',
          total: shiftData.noche.total,
          percentage: grandTotal > 0 ? (shiftData.noche.total / grandTotal) * 100 : 0,
          sales_count: shiftData.noche.count,
        },
      ];

      return result;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'pos') {
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      const data = await salesService.getPosDashboard(user.id, user.pos_number || 0);
      const perDay = await salesService.getSalesByDayAndPos(user.pos_number || 0, 200);
      const perHour = await getSalesPerHour(user.pos_number || 0, 30);
      const weather = await getWeatherByPos(user.pos_number || 0, 200);
      
      setStats(data);
      setSalesPerDay(perDay);
      setSalesPerHour(perHour);
      setWeatherByDate(weather);
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
      <div className="max-w-6xl mx-auto p-3 sm:p-6">
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
              <h2 className="text-xl font-bold mb-4">Ventas por Hora (últimos 30 días)</h2>
              {salesPerHour.length === 0 ? (
                <p className="text-gray-600">No hay datos disponibles</p>
              ) : (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={salesPerHour} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="hour" angle={-45} textAnchor="end" height={80} />
                      <YAxis yAxisId="left" label={{ value: 'Total Vendido ($)', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Porcentaje (%)', angle: 90, position: 'insideRight' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => {
                          return value > 10 ? `$${value.toFixed(2)}` : `${value.toFixed(1)}%`;
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="total" fill="#f97316" name="Total Vendido" radius={[8, 8, 0, 0]} />
                      <Bar yAxisId="right" dataKey="percentage" fill="#3b82f6" name="Porcentaje %" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Franja Horaria</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Vendido</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Porcentaje</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Transacciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesPerHour.map((shift, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">{shift.hour}</td>
                            <td className="px-4 py-3 text-right font-bold text-orange-600">${shift.total.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                                {shift.percentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">{shift.sales_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Clima</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Vendido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesPerDay.slice().reverse().map((day, idx) => {
                          const weather = weatherByDate[day.date];
                          return (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {new Date(day.date + 'T03:00:00').toLocaleDateString('es-AR', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {weather ? (
                                  <div className="space-y-1">
                                    <div className="font-medium text-gray-900">{weather.summary}</div>
                                    {weather.hasVariation && (
                                      <div className="text-xs text-gray-500 italic">
                                        Mañana: {weather.morning} | Tarde: {weather.afternoon} | Noche: {weather.evening}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Cargando...</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-orange-600">${day.total.toFixed(2)}</td>
                            </tr>
                          );
                        })}
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
