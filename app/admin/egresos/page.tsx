'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { Expense, ExpenseCategory } from '@/lib/types';

const CATEGORIES: ExpenseCategory[] = ['Compra de Inventario', 'Servicios', 'Gastos Operativos', 'Otros'];
const STATUS_OPTIONS = ['pendiente', 'aprobado', 'rechazado'] as const;
const POS_OPTIONS = [
  { id: 1, name: 'Costa del Este' },
  { id: 2, name: 'Mar de las Pampas' },
  { id: 3, name: 'Costa Esmeralda' },
];

export default function ExpensesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPos, setFilterPos] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchExpenses();
  }, [user, router, filterStatus, filterCategory, filterPos]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterCategory) params.append('category', filterCategory);
      if (filterPos) params.append('posNumber', filterPos);

      const response = await fetch(`/api/egresos?${params.toString()}`);
      const data = await response.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (expenseId: string, newStatus: string) => {
    setUpdatingId(expenseId);
    try {
      const response = await fetch(`/api/egresos/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setExpenses(
          expenses.map((exp) =>
            exp.id === expenseId ? { ...exp, status: newStatus as any } : exp
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getPosName = (posNumber?: number): string => {
    if (!posNumber) return 'General';
    const pos = POS_OPTIONS.find((p) => p.id === posNumber);
    return pos?.name || `POS ${posNumber}`;
  };

  const getCategoryColor = (category: ExpenseCategory): string => {
    switch (category) {
      case 'Compra de Inventario':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'Servicios':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'Gastos Operativos':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'Otros':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'aprobado':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'rechazado':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string): string => {
    switch (paymentStatus) {
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'unpaid':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const getPaymentStatusLabel = (paymentStatus: string): string => {
    return paymentStatus === 'paid' ? 'Pagado' : 'Sin Pagar';
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Compras</h1>
          <Link
            href="/admin/egresos/crear"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            + Nueva Compra
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-6 space-y-4 sm:space-y-0 sm:flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filterPos}
            onChange={(e) => setFilterPos(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todos los POS</option>
            {POS_OPTIONS.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lista de Egresos */}
        {loading ? (
          <div className="text-center py-12 text-gray-900 dark:text-gray-100">Cargando compras...</div>
        ) : expenses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center text-gray-600 dark:text-gray-400">
            No hay compras registradas
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div
                  onClick={() => setExpandedId(expandedId === expense.id ? null : expense.id)}
                  className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Fecha</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {new Date(expense.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Categoría</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">POS</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{getPosName(expense.pos_number)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Total</p>
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">${expense.total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(expense.status)}`}>
                        {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(expense.payment_status)}`}>
                        {getPaymentStatusLabel(expense.payment_status)}
                      </span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {expandedId === expense.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Detalles expandidos */}
                {expandedId === expense.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 space-y-4">
                    {/* Items */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Artículos</h3>
                      <div className="space-y-2">
                        {expense.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm bg-white dark:bg-gray-800 p-3 rounded">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{item.description}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {item.quantity} × ${item.unit_price.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white">${item.subtotal.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resumen */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded space-y-1 border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">${expense.subtotal.toFixed(2)}</span>
                      </div>
                      {(expense.shipping_cost || 0) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Envío:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">${(expense.shipping_cost || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-1 flex justify-between text-base font-bold">
                        <span className="text-gray-900 dark:text-white">Total:</span>
                        <span className="text-orange-600 dark:text-orange-400">${expense.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Estado de Pago */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Estado de Pago:</p>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(expense.payment_status)}`}>
                          {getPaymentStatusLabel(expense.payment_status)}
                        </span>
                        {expense.payment_status === 'unpaid' && expense.check_date && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Fecha límite: {new Date(expense.check_date).toLocaleDateString('es-AR')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notas */}
                    {expense.notes && (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Notas:</p>
                        <p className="text-sm text-gray-900 dark:text-white italic">{expense.notes}</p>
                      </div>
                    )}

                    {/* Acciones de Estado */}
                    {expense.status === 'pendiente' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(expense.id, 'aprobado')}
                          disabled={updatingId === expense.id}
                          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                        >
                          ✓ Aprobar
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(expense.id, 'rechazado')}
                          disabled={updatingId === expense.id}
                          className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                        >
                          ✕ Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
