'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import { ExpenseCategory, ExpenseItem, Product } from '@/lib/types';
import { productService } from '@/lib/services/products';

interface FormItem extends ExpenseItem {
  id: string;
  product_id?: string;
}

const CATEGORIES: ExpenseCategory[] = ['Compra de Inventario', 'Servicios', 'Gastos Operativos', 'Otros'];
const POS_OPTIONS = [
  { id: 1, name: 'Costa del Este' },
  { id: 2, name: 'Mar de las Pampas' },
  { id: 3, name: 'Costa Esmeralda' },
];

export default function CreateExpensePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    subcategory: '',
    image_url: '',
  });
  const [creatingProduct, setCreatingProduct] = useState(false);

  const [category, setCategory] = useState<ExpenseCategory>('Compra de Inventario');
  const [posNumber, setPosNumber] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [checkDate, setCheckDate] = useState('');
  const [items, setItems] = useState<FormItem[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    loadProducts();
  }, [user, router]);

  const loadProducts = async () => {
    const prods = await productService.getAll();
    setProducts(prods);
  };

  const handleCreateProduct = async () => {
    if (!newProductForm.name.trim()) {
      alert('El nombre del producto es requerido');
      return;
    }

    setCreatingProduct(true);
    try {
      const createdProduct = await productService.create({
        name: newProductForm.name,
        description: newProductForm.description,
        price: newProductForm.price,
        stock: newProductForm.stock,
        category: newProductForm.category || undefined,
        subcategory: newProductForm.subcategory || undefined,
        image_url: newProductForm.image_url,
      });

      if (createdProduct) {
        setProducts([...products, createdProduct]);
        setShowNewProductModal(false);
        setNewProductForm({
          name: '',
          description: '',
          price: 0,
          stock: 0,
          category: '',
          subcategory: '',
          image_url: '',
        });
      } else {
        alert('Error al crear el producto');
      }
    } finally {
      setCreatingProduct(false);
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
        subtotal: 0,
        product_id: undefined,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          
          if (field === 'product_id') {
            const selectedProduct = products.find((p) => p.id === value);
            if (selectedProduct) {
              updated.description = selectedProduct.name;
              updated.unit_price = selectedProduct.price;
              updated.subtotal = updated.quantity * selectedProduct.price;
            }
          } else if (field === 'quantity' || field === 'unit_price') {
            updated.subtotal = updated.quantity * updated.unit_price;
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

    if (!user) return;

    if (items.length === 0) {
      setError('Debe agregar al menos un artículo');
      return;
    }

    if (items.some((item) => !item.description.trim() || item.quantity <= 0 || item.unit_price < 0)) {
      setError('Por favor, completa todos los campos correctamente');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/egresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdBy: user.id,
          posNumber: posNumber || undefined,
          category,
          items: items.map(({ id, ...rest }) => rest),
          subtotal,
          shippingCost: shippingCost || undefined,
          total,
          notes: notes || undefined,
          paymentStatus,
          checkDate: paymentStatus === 'unpaid' && checkDate ? checkDate : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al registrar el egreso');
        return;
      }

      setSuccess('Egreso registrado correctamente');
      setTimeout(() => {
        router.push('/admin/egresos');
      }, 2000);
    } catch (err) {
      setError('Error al registrar el egreso');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Registrar Nueva Compra</h1>

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
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
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

          {/* Fecha Límite de Cheque (solo si está sin pagar) */}
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

          {/* Artículos */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Artículos</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                >
                  + Agregar Artículo
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                >
                  + Producto Nuevo
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                Haz clic en "Agregar Artículo" para comenzar
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Producto del Catálogo
                        </label>
                        <select
                          value={item.product_id || ''}
                          onChange={(e) => updateItem(item.id, 'product_id', e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="">Seleccionar producto...</option>
                          {products.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} - ${prod.price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          O Descripción manual
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Ej: Café gourmet"
                          disabled={!!item.product_id}
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
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                    
                    {item.product_id && (
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, 'product_id', undefined)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        ← Desseleccionar producto
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Valor Unitario ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Subtotal ($)
                        </label>
                        <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-900 dark:text-white">
                          {item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="w-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 px-3 py-2 rounded-lg font-semibold transition text-sm"
                    >
                      Eliminar Artículo
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Costo de Envío */}
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
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold transition"
            >
              {loading ? 'Registrando...' : 'Registrar Compra'}
            </button>
          </div>
        </form>

        {/* Modal - Crear Producto Nuevo */}
        {showNewProductModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Crear Producto Nuevo</h2>
                  <button
                    onClick={() => setShowNewProductModal(false)}
                    disabled={creatingProduct}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    placeholder="Ej: Café gourmet premium"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={newProductForm.description}
                    onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                    placeholder="Detalles del producto..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Stock inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newProductForm.stock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    placeholder="Ej: Bebidas"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Subcategoría
                  </label>
                  <input
                    type="text"
                    value={newProductForm.subcategory}
                    onChange={(e) => setNewProductForm({ ...newProductForm, subcategory: e.target.value })}
                    placeholder="Ej: Café"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewProductModal(false)}
                    disabled={creatingProduct}
                    className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateProduct}
                    disabled={creatingProduct || !newProductForm.name.trim()}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {creatingProduct ? 'Creando...' : 'Crear Producto'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
