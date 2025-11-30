'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore, useCartStore } from '@/lib/store';
import { productService } from '@/lib/services/products';
import { salesService } from '@/lib/services/sales';
import { Product, SaleItem } from '@/lib/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, getTotal, clearCart } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'pos') {
      router.push('/');
      return;
    }

    if (items.length === 0) {
      router.push('/pos/catalog');
      return;
    }

    const fetchProducts = async () => {
      const data = await productService.getAll();
      setProducts(data);
    };

    fetchProducts();
  }, [user, router, items]);

  const handleCompleteSale = async () => {
    if (!user || user.role !== 'pos') return;

    setProcessing(true);
    setError('');

    const saleItems: SaleItem[] = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        product_id: item.product_id,
        product_name: product?.name || 'Producto desconocido',
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      };
    });

    const total = getTotal();

    const sale = await salesService.createSale(user.id, user.pos_number || 0, saleItems, total);

    if (sale) {
      clearCart();
      router.push('/pos/confirmation');
    } else {
      setError('Error al procesar la venta. Intenta nuevamente.');
      setProcessing(false);
    }
  };

  if (!user) {
    return null;
  }

  const total = getTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Confirmación de venta</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Resumen de venta</h2>
          <div className="space-y-3">
            {items.map((item) => {
              const product = products.find((p) => p.id === item.product_id);
              return (
                <div key={item.product_id} className="flex justify-between pb-3 border-b">
                  <div>
                    <p className="font-semibold">{product?.name}</p>
                    <p className="text-sm text-gray-600">
                      ${item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t-2">
            <div className="flex justify-between text-2xl font-bold">
              <span>Total:</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 bg-gray-400 text-white py-3 rounded-lg hover:bg-gray-500 transition"
          >
            Volver
          </button>
          <button
            onClick={handleCompleteSale}
            disabled={processing}
            className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Procesando...' : 'Confirmar venta'}
          </button>
        </div>
      </div>
    </div>
  );
}
