'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { Expense } from '@/lib/types';

const POS_OPTIONS = [
  { id: 1, name: 'Costa del Este' },
  { id: 2, name: 'Mar de las Pampas' },
  { id: 3, name: 'Costa Esmeralda' },
];

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [checkDate, setCheckDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const expenseId = params.id as string;

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchExpense();
  }, [user, router, expenseId]);

  const fetchExpense = async () => {
    try {
      const response = await fetch(`/api/egresos/${expenseId}`);
      if (response.ok) {
        const data = await response.json();
        setExpense(data);
        setPaymentStatus(data.payment_status || 'paid');
        setCheckDate(data.check_date || '');
      } else {
        setError('No se pudo cargar el egreso');
      }
    } catch (err) {
      console.error('Error fetching expense:', err);
      setError('Error al cargar el egreso');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      console.log('Submitting update for expense:', expenseId);
      const updatePayload = {
        payment_status: paymentStatus,
      };
      
      if (paymentStatus === 'unpaid' && checkDate) {
        (updatePayload as any).check_date = checkDate;
      } else if (paymentStatus === 'paid') {
        (updatePayload as any).check_date = null;
      }

      console.log('Update payload:', updatePayload);

      const response = await fetch(`/api/egresos/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Egreso actualizado correctamente');
        setTimeout(() => {
          router.push('/admin/egresos');
        }, 2000);
      } else {
        console.error('Update error:', data);
        setError(data.error || 'Error al actualizar el egreso');
      }
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Error al actualizar el egreso');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-2xl mx-auto p-6">
          <div className="text-center text-gray-600 dark:text-gray-400">Cargando egreso...</div>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg">
            Egreso no encontrado
          </div>
          <button
            onClick={() => router.push('/admin/egresos')}
            className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Volver a Egresos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-2xl mx-auto p-3 sm:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Editar Egreso</h1>
          <button
            onClick={() => router.push('/admin/egresos')}
            className="text-orange-500 hover:text-orange-600 font-semibold"
          >
            ← Volver
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* Resumen del egreso */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Categoría</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{expense.category || 'Sin categoría'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Total</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">${expense.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Fecha</p>
                <p className="text-sm text-gray-900 dark:text-white">{new Date(expense.created_at).toLocaleDateString('es-AR')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">POS</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {expense.pos_number ? POS_OPTIONS.find(p => p.id === expense.pos_number)?.name : 'General'}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Estado de Pago
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'unpaid')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="paid">Pagado</option>
                <option value="unpaid">Sin Pagar</option>
              </select>
            </div>

            {paymentStatus === 'unpaid' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Fecha Límite de Pago (opcional)
                </label>
                <input
                  type="date"
                  value={checkDate}
                  onChange={(e) => setCheckDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                {submitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/egresos')}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
