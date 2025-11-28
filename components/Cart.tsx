'use client';

import { useCartStore } from '@/lib/store';
import { Product } from '@/lib/types';

export function Cart({ products }: { products: Product[] }) {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name || 'Producto desconocido';
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow flex flex-col h-full items-center justify-center text-center text-gray-600 p-6">
        <p className="text-lg">🛒</p>
        <p className="font-semibold">El carrito está vacío</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full">
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold">Carrito</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {items.map((item) => (
          <div
            key={item.product_id}
            className="flex justify-between items-center p-3 bg-gray-50 rounded"
          >
            <div>
              <p className="font-semibold text-sm">{getProductName(item.product_id)}</p>
              <p className="text-xs text-gray-600">
                ${item.price.toFixed(2)} x {item.quantity}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              <input
                type="number"
                min="1"
                max="100"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                className="w-14 p-1 border rounded text-center text-sm"
              />
              <button
                onClick={() => removeItem(item.product_id)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 p-6 bg-gradient-to-r from-orange-50 to-slate-50">
        <div className="flex justify-between text-lg font-bold mb-4">
          <span>Total:</span>
          <span className="text-orange-600">${total.toFixed(2)}</span>
        </div>

        <button
          onClick={clearCart}
          className="w-full bg-gray-400 text-white py-2 rounded hover:bg-gray-500 text-sm font-semibold"
        >
          Limpiar carrito
        </button>
      </div>
    </div>
  );
}
