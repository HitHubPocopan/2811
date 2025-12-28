'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { ExpenseCategory, ExpenseItem, Expense } from '@/lib/types';

interface FormItem extends ExpenseItem {
  id: string;
  product_id?: string;
  productSearchInput?: string;
  selling_price?: number;
  confirmed?: boolean;
}

const CATEGORIES: ExpenseCategory[] = ['Compra de Inventario', 'Expensas', 'Luz', 'Internet', 'Agua', 'Otros'];
const POS_OPTIONS = [
  { id: 1, name: 'Costa del Este' },
  { id: 2, name: 'Mar de las Pampas' },
  { id: 3, name: 'Costa Esmeralda' },
];

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const expenseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expense, setExpense] = useState<Expense | null>(null);

  const [category, setCategory] = useState<ExpenseCategory>('Compra de Inventario');
  const [posNumber, setPosNumber] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [checkDate, setCheckDate] = useState('');
  const [items, setItems] = useState<FormItem[]>([]);
  const [simpleExpenseAmount, setSimpleExpenseAmount] = useState<number>(0);
  const [simpleExpenseDescription, setSimpleExpenseDescription] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    const loadData = async () => {
      try {
        const expenseData = await fetch(`/api/egresos?id=${expenseId}`).then(r => r.json());

        if (expenseData && expenseData.id) {
          setExpense(expenseData);
          loadExpenseData(expenseData);
        } else {
          setError('No se encontró el gasto');
        }
      } catch (err: unknown) {
        console.error('Error loading data:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, router, expenseId]);

  const loadExpenseData = (exp: Expense) => {
    setCategory(exp.category as ExpenseCategory);
    setPosNumber(exp.pos_number || null);
    setShippingCost(exp.shipping_cost || 0);
    setNotes(exp.notes || '');
    setPaymentStatus(exp.payment_status as 'paid' | 'unpaid');
    setCheckDate(exp.check_date || '');

    if (exp.category === 'Compra de Inventario') {
      const formItems = exp.items.map((item: ExpenseItem, idx: number) => ({
        id: `item-${idx}`,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        purchase_price: item.purchase_price,
        subtotal: item.subtotal,
        confirmed: true,
      }));
      setItems(formItems);
    } else {
      if (exp.items.length > 0) {
        setSimpleExpenseAmount(exp.total);
        setSimpleExpenseDescription(exp.items[0].description);
      }
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unit_price: 0,
        purchase_price: 0,
        subtotal: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const confirmItem = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, confirmed: true } : item
      )
    );
  };

  const updateItem = (id: string, field: string, value: string | number | undefined) => {
    setItems(
      items.map((item) => {
        if (item.id === id && !item.confirmed) {
          const updated = { ...item, [field]: value };

          if (field === 'quantity' || field === 'purchase_price') {
            updated.subtotal = updated.quantity * updated.purchase_price;
          }

          return updated;
        }
        return item;
      })
    );
  };

  const calculateSubtotal = (): number => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const subtotal = calculateSubtotal();
  const total = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user || !expense) return;

    const isInventoryPurchase = category === 'Compra de Inventario';

    if (isInventoryPurchase) {
      if (items.length === 0) {
        setError('Debe agregar al menos un artículo');
        return;
      }

      if (items.some((item) => !item.description.trim() || item.quantity <= 0)) {
        setError('Por favor, completa descripción y cantidad correctamente');
        return;
      }
    } else {
      if (simpleExpenseAmount <= 0) {
        setError('El monto del gasto debe ser mayor a 0');
        return;
      }
    }

    setSaving(true);

    try {
      let payload;

      if (isInventoryPurchase) {
        payload = {
          category,
          items: items.map((item) => {
            const qty = item.quantity || 0;
            const price = item.purchase_price || 0;
            const itemSubtotal = qty * price;
            return {
              description: item.description,
              quantity: qty,
              unit_price: item.unit_price || 0,
              purchase_price: price,
              subtotal: itemSubtotal,
            };
          }),
          subtotal: items.reduce((sum, item) => {
            const qty = item.quantity || 0;
            const price = item.purchase_price || 0;
            return sum + (qty * price);
          }, 0),
          shipping_cost: shippingCost || undefined,
          total: items.reduce((sum, item) => {
            const qty = item.quantity || 0;
            const price = item.purchase_price || 0;
            return sum + (qty * price);
          }, 0) + (shippingCost || 0),
          notes: notes || undefined,
          pos_number: posNumber || undefined,
          payment_status: paymentStatus,
          check_date: paymentStatus === 'unpaid' && checkDate ? checkDate : undefined,
        };
      } else {
        payload = {
          category,
          items: [
            {
              description: simpleExpenseDescription || category,
              quantity: 1,
              unit_price: simpleExpenseAmount,
              purchase_price: simpleExpenseAmount,
              subtotal: simpleExpenseAmount,
            },
          ],
          subtotal: simpleExpenseAmount,
          total: simpleExpenseAmount,
          notes: notes || undefined,
          pos_number: posNumber || undefined,
          payment_status: paymentStatus,
          check_date: paymentStatus === 'unpaid' && checkDate ? checkDate : undefined,
        };
      }

      const response = await fetch(`/api/egresos?id=${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al actualizar el egreso');
        return;
      }

      setSuccess('Egreso actualizado correctamente');
      setTimeout(() => {
        router.push('/admin/egresos');
      }, 2000);
    } catch (err: unknown) {
      setError('Error al actualizar el egreso');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto p-3 sm:p-6 text-center py-12 text-gray-900 dark:text-gray-100">
          Cargando gasto...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Editar Compra</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 p-4 rounded-lg">
              {success}
            </div>
          )}

          {/* Categoría */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Categoría de Gasto
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as ExpenseCategory);
                setItems([]);
                setSimpleExpenseAmount(0);
                setSimpleExpenseDescription('');
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* POS (opcional) */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Punto de Venta (Opcional)
            </label>
            <select
              value={posNumber || ''}
              onChange={(e) => setPosNumber(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecciona un POS (opcional)</option>
              {POS_OPTIONS.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estado de Pago */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Estado de Pago
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentStatus"
                  value="paid"
                  checked={paymentStatus === 'paid'}
                  onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'unpaid')}
                  className="w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300">Pagado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentStatus"
                  value="unpaid"
                  checked={paymentStatus === 'unpaid'}
                  onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'unpaid')}
                  className="w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300">Sin Pagar (Deuda)</span>
              </label>
            </div>
          </div>

          {/* Fecha Límite de Cheque */}
          {paymentStatus === 'unpaid' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Fecha Límite de Cheque (Opcional)
              </label>
              <input
                type="date"
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Especifica la fecha límite si se espera cobro mediante cheque</p>
            </div>
          )}

          {/* Artículos o Monto Simple según categoría */}
          {category === 'Compra de Inventario' ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Artículos</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                >
                  + Agregar Artículo
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Haz clic en &quot;Agregar Artículo&quot; para comenzar
                </p>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Descripción
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Ej: Café gourmet"
                            disabled={item.confirmed}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={item.quantity || ''}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            placeholder="1"
                            disabled={item.confirmed}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Precio de Compra Unitario ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.purchase_price || ''}
                            onChange={(e) => updateItem(item.id, 'purchase_price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            disabled={item.confirmed}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                          />
                        </div>
                      </div>

                      <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Subtotal:</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">${item.subtotal.toFixed(2)}</p>
                      </div>

                      <div className="flex gap-2">
                        {item.confirmed ? (
                          <button
                            type="button"
                            disabled
                            className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg font-semibold text-sm opacity-75"
                          >
                            ✓ Artículo Confirmado
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => confirmItem(item.id)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-semibold transition text-sm"
                          >
                            Confirmar Artículo
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 px-3 py-2 rounded-lg font-semibold transition text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Detalles del Gasto</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Monto del Gasto ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={simpleExpenseAmount || ''}
                    onChange={(e) => setSimpleExpenseAmount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    value={simpleExpenseDescription}
                    onChange={(e) => setSimpleExpenseDescription(e.target.value)}
                    placeholder={`Ej: ${category}`}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Costo de Envío - Solo para Compra de Inventario */}
          {category === 'Compra de Inventario' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Costo de Envío (Opcional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* Notas */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Compra a proveedor X, referencia PO-123"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Resumen */}
          <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-700">
            <div className="space-y-2">
              {category === 'Compra de Inventario' ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Costo de Envío:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-orange-300 dark:border-orange-600 pt-2 flex justify-between text-lg">
                    <span className="font-bold text-gray-900 dark:text-white">Total:</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">${total.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-900 dark:text-white">Total:</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">${simpleExpenseAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition text-base"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/egresos')}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition text-base"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
