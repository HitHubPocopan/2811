'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore, useCartStore } from '@/lib/store';
import { productService } from '@/lib/services/products';
import { Product, SaleItem, PaymentMethod, PaymentBreakdown } from '@/lib/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, getTotal, clearCart } = useCartStore();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [mixedPayment, setMixedPayment] = useState(false);
  const [mixedMethod1, setMixedMethod1] = useState<PaymentMethod>('Efectivo');
  const [mixedAmount1, setMixedAmount1] = useState<number>(0);
  const [mixedMethod2, setMixedMethod2] = useState<PaymentMethod>('Transferencia');
  const [mixedAmount2, setMixedAmount2] = useState<number>(0);

  useEffect(() => {
    if (!user || user.role !== 'pos') {
      router.push('/');
      return;
    }

    if (items.length === 0) {
      router.push('/pos/catalog');
      return;
    }
  }, [user, router, items]);

  const handleCompleteSale = async () => {
    if (!user || user.role !== 'pos') return;
    
    if (!paymentMethod) {
      setError('Por favor selecciona un método de pago.');
      return;
    }

    if (paymentMethod === 'Mixto') {
      const total = getTotal();
      if (mixedAmount1 + mixedAmount2 !== total) {
        setError(`Los montos deben sumar ${total.toFixed(2)}. Actualmente: ${(mixedAmount1 + mixedAmount2).toFixed(2)}`);
        return;
      }
    }

    setProcessing(true);
    setError('');

    const saleItems: SaleItem[] = items.map((item) => {
      return {
        product_id: item.product_id,
        product_name: item.product_name || 'Producto desconocido',
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      };
    });

    const total = getTotal();

    let paymentBreakdown: PaymentBreakdown | undefined;
    if (paymentMethod === 'Mixto') {
      paymentBreakdown = {
        method1: mixedMethod1,
        amount1: mixedAmount1,
        method2: mixedMethod2,
        amount2: mixedAmount2,
      };
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          posId: user.id,
          posNumber: user.pos_number || 0,
          items: saleItems,
          total,
          paymentMethod,
          paymentBreakdown,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al procesar la venta. Intenta nuevamente.');
        setProcessing(false);
        return;
      }

      clearCart();
      router.push('/pos/confirmation');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al procesar la venta';
      setError(errorMessage);
      setProcessing(false);
    }
  };

  if (!user) {
    return null;
  }

  const total = getTotal();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-2xl mx-auto p-3 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">Confirmación de venta</h1>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">Resumen de venta</h2>
          <div className="space-y-3">
            {items.map((item) => {
              return (
                <div key={item.product_id} className="flex justify-between pb-3 border-b">
                  <div>
                    <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{item.product_name || 'Producto desconocido'}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-600">
                      ${item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-sm sm:text-base">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              <span>Total:</span>
              <span className="text-green-600 dark:text-green-400">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">Método de pago</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {(['Efectivo', 'Transferencia', 'QR', 'Débito', 'Crédito', 'Mixto'] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => {
                  setPaymentMethod(method);
                  setMixedPayment(method === 'Mixto');
                }}
                className={`py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold transition text-xs sm:text-sm ${
                  paymentMethod === method
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {mixedPayment && (
          <div className="bg-blue-50 p-4 sm:p-6 rounded-lg shadow mb-6 border border-blue-200">
            <h3 className="text-base sm:text-lg font-bold mb-4 text-blue-900">Detalles de pago mixto</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Método 1</label>
                  <select
                    value={mixedMethod1}
                    onChange={(e) => setMixedMethod1(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(['Efectivo', 'Transferencia', 'QR', 'Débito', 'Crédito'] as PaymentMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Monto 1</label>
                  <input
                    type="number"
                    value={mixedAmount1}
                    onChange={(e) => setMixedAmount1(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Método 2</label>
                  <select
                    value={mixedMethod2}
                    onChange={(e) => setMixedMethod2(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(['Efectivo', 'Transferencia', 'QR', 'Débito', 'Crédito'] as PaymentMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Monto 2</label>
                  <input
                    type="number"
                    value={mixedAmount2}
                    onChange={(e) => setMixedAmount2(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                <p className="text-sm font-semibold text-gray-700">
                  Total: <span className="text-blue-600">${(mixedAmount1 + mixedAmount2).toFixed(2)}</span> / Requerido: <span className="text-orange-600">${total.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-6 text-xs sm:text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 bg-gray-400 text-white py-3 rounded-lg hover:bg-gray-500 transition font-semibold text-sm sm:text-base"
          >
            Volver
          </button>
          <button
            onClick={handleCompleteSale}
            disabled={processing}
            className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {processing ? 'Procesando...' : 'Confirmar venta'}
          </button>
        </div>
      </div>
    </div>
  );
}
