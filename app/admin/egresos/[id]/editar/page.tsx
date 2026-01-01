'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { Expense, ExpenseCategory, ExpenseItem, Product } from '@/lib/types';
import { productService } from '@/lib/services/products';

const POS_OPTIONS = [
  { id: 1, name: 'Costa del Este' },
  { id: 2, name: 'Mar de las Pampas' },
  { id: 3, name: 'Costa Esmeralda' },
];

const CATEGORIES: ExpenseCategory[] = ['Compra de Inventario', 'Expensas', 'Luz', 'Internet', 'Agua', 'Otros'];

interface FormItem extends ExpenseItem {
  id: string;
  product_id?: string;
  productSearchInput?: string;
  selling_price?: number;
  confirmed?: boolean;
}

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Form fields
  const [category, setCategory] = useState<ExpenseCategory>('Compra de Inventario');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [checkDate, setCheckDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<FormItem[]>([]);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [simpleExpenseAmount, setSimpleExpenseAmount] = useState<number>(0);
  const [simpleExpenseDescription, setSimpleExpenseDescription] = useState('');
  
  // Products for search
  const [products, setProducts] = useState<Product[]>([]);
  const [openSearchDropdownId, setOpenSearchDropdownId] = useState<string | null>(null);

  const expenseId = params.id as string;

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    const init = async () => {
      await loadProducts();
      await fetchExpense();
    };
    
    init();
  }, [user, router, expenseId]);

  const loadProducts = async () => {
    const prods = await productService.getAll();
    setProducts(prods);
  };

  const fetchExpense = async () => {
    try {
      const response = await fetch(`/api/egresos/${expenseId}`);
      if (response.ok) {
        const data: Expense = await response.json();
        setExpense(data);
        
        // Initialize form fields
        setCategory(data.category || 'Otros');
        setPaymentStatus(data.payment_status || 'paid');
        setCheckDate(data.check_date || '');
        setNotes(data.notes || '');
        setShippingCost(data.shipping_cost || 0);
        
        if (data.category === 'Compra de Inventario') {
          setItems(data.items.map((item, idx) => ({
            ...item,
            id: `existing-${idx}`,
            confirmed: true
          })));
        } else {
          setSimpleExpenseAmount(data.total);
          setSimpleExpenseDescription(data.items[0]?.description || '');
        }
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
        product_id: undefined,
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
          
          if (field === 'product_id') {
            const selectedProduct = products.find((p) => p.id === value);
            if (selectedProduct) {
              updated.description = selectedProduct.name;
              updated.unit_price = selectedProduct.price;
              updated.purchase_price = selectedProduct.price;
              updated.subtotal = updated.quantity * updated.purchase_price;
            }
          } else if (field === 'quantity' || field === 'purchase_price') {
            updated.subtotal = updated.quantity * updated.purchase_price;
          }
          
          return updated;
        }
        return item;
      })
    );
  };

  const handleSelectProduct = (itemId: string, productId: string) => {
    const selectedProduct = products.find((p) => p.id === productId);
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const sellingPrice = selectedProduct?.price || 0;
          return {
            ...item,
            product_id: productId,
            description: selectedProduct?.name || '',
            unit_price: sellingPrice,
            selling_price: sellingPrice,
            purchase_price: sellingPrice,
            subtotal: item.quantity * sellingPrice,
            productSearchInput: '',
          };
        }
        return item;
      })
    );
    setOpenSearchDropdownId(null);
  };

  const calculateSubtotal = (): number => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const subtotal = calculateSubtotal();
  const total = category === 'Compra de Inventario' ? subtotal + shippingCost : simpleExpenseAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const isInventoryPurchase = category === 'Compra de Inventario';

    if (isInventoryPurchase) {
      if (items.length === 0) {
        setError('Debe agregar al menos un artículo');
        setSubmitting(false);
        return;
      }
      if (items.some((item) => !item.description.trim() || item.quantity <= 0)) {
        setError('Por favor, completa descripción y cantidad correctamente');
        setSubmitting(false);
        return;
      }
    } else {
      if (simpleExpenseAmount <= 0) {
        setError('El monto del gasto debe ser mayor a 0');
        setSubmitting(false);
        return;
      }
    }

    try {
      let updatePayload: any;

      if (isInventoryPurchase) {
        updatePayload = {
          category,
          items: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            purchase_price: item.purchase_price,
            subtotal: item.subtotal,
          })),
          subtotal,
          shipping_cost: shippingCost,
          total,
          notes,
          payment_status: paymentStatus,
          check_date: paymentStatus === 'unpaid' && checkDate ? checkDate : null,
        };
      } else {
        updatePayload = {
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
          notes,
          payment_status: paymentStatus,
          check_date: paymentStatus === 'unpaid' && checkDate ? checkDate : null,
        };
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
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Editar Egreso</h1>
          <button
            onClick={() => router.push('/admin/egresos')}
            className="text-orange-500 hover:text-orange-600 font-semibold"
          >
            ← Volver
          </button>
        </div>

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

          {/* Información Inmutable */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 border-b pb-2">Información del Registro</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Fecha de Creación</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(expense.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Punto de Venta (POS)</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {expense.pos_number ? POS_OPTIONS.find(p => p.id === expense.pos_number)?.name : 'General'}
                </p>
              </div>
            </div>
          </div>

          {/* Categoría */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Categoría de Gasto
            </label>
            <select
              value={category}
              onChange={(e) => {
                const newCat = e.target.value as ExpenseCategory;
                setCategory(newCat);
                if (newCat !== 'Compra de Inventario' && items.length > 0) {
                  setSimpleExpenseAmount(calculateSubtotal());
                  setItems([]);
                } else if (newCat === 'Compra de Inventario' && items.length === 0) {
                  setSimpleExpenseAmount(0);
                }
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

          {/* Fecha Límite de Cheque (solo si está sin pagar) */}
          {paymentStatus === 'unpaid' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Fecha Límite de Pago / Cheque (Opcional)
              </label>
              <input
                type="date"
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              />
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

              <div className="space-y-4">
                {items.map((item) => {
                  const filteredProducts = item.productSearchInput
                    ? products.filter((p) =>
                        p.name.toLowerCase().includes(item.productSearchInput!.toLowerCase())
                      )
                    : [];

                  return (
                    <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Buscar Producto
                          </label>
                          {item.product_id ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600 rounded-lg text-sm text-blue-900 dark:text-blue-300 font-semibold">
                                {products.find((p) => p.id === item.product_id)?.name || 'Producto'}
                              </div>
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, 'product_id', undefined)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                              >
                                ✕ Cambiar
                              </button>
                            </div>
                          ) : (
                            <>
                              <input
                                type="text"
                                value={item.productSearchInput || ''}
                                onChange={(e) => updateItem(item.id, 'productSearchInput', e.target.value)}
                                onFocus={() => !item.confirmed && setOpenSearchDropdownId(item.id)}
                                onBlur={() => setTimeout(() => setOpenSearchDropdownId(null), 150)}
                                placeholder="Escribe para buscar..."
                                disabled={item.confirmed}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50"
                              />
                              {openSearchDropdownId === item.id && filteredProducts.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                  {filteredProducts.map((prod) => (
                                    <div
                                      key={prod.id}
                                      onClick={() => handleSelectProduct(item.id, prod.id)}
                                      className="px-4 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer text-sm border-b last:border-0 border-gray-100 dark:border-gray-600"
                                    >
                                      <div className="font-semibold text-gray-900 dark:text-white">{prod.name}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">${prod.price}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Descripción / Manual
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            disabled={item.confirmed}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Precio Compra Unit.
                          </label>
                          <input
                            type="number"
                            value={item.purchase_price}
                            onChange={(e) => updateItem(item.id, 'purchase_price', parseFloat(e.target.value) || 0)}
                            disabled={item.confirmed}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50 font-bold text-orange-600"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <div className="flex items-center gap-4">
                          <div className="w-24">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                              disabled={item.confirmed}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Subtotal Item</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">${item.subtotal.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {!item.confirmed ? (
                            <button
                              type="button"
                              onClick={() => confirmItem(item.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition text-xs"
                            >
                              ✓ Confirmar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, confirmed: false } : i))}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition text-xs"
                            >
                              ✎ Editar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition text-xs"
                          >
                            ✕ Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Costo de Envío */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="max-w-xs ml-auto">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-right">
                    Costo de Envío
                  </label>
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-right font-bold text-blue-600"
                  />
                </div>
              </div>

              {/* Totales */}
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Envío:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-orange-200 dark:border-orange-800">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Total Final:</span>
                  <span className="text-2xl font-black text-orange-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Monto Total del Gasto
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={simpleExpenseAmount}
                    onChange={(e) => setSimpleExpenseAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-xl font-bold text-orange-600"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Descripción Corta (Opcional)
                </label>
                <input
                  type="text"
                  value={simpleExpenseDescription}
                  onChange={(e) => setSimpleExpenseDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder={category}
                />
              </div>
            </div>
          )}

          {/* Notas Generales */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Notas Generales / Observaciones
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white min-h-[100px]"
              placeholder="Escribe aquí cualquier observación adicional..."
            ></textarea>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={submitting || (category === 'Compra de Inventario' && items.length === 0)}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {submitting ? 'Guardando Cambios...' : '✓ Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/egresos')}
              className="px-8 bg-gray-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
