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
      <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-600">
        El carrito está vacío
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Carrito</h2>
      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div
            key={item.product_id}
            className="flex justify-between items-center p-3 bg-gray-50 rounded"
          >
            <div>
              <p className="font-semibold">{getProductName(item.product_id)}</p>
              <p className="text-sm text-gray-600">
                ${item.price.toFixed(2)} x {item.quantity}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                className="w-16 p-1 border rounded text-center"
              />
              <button
                onClick={() => removeItem(item.product_id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 mb-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={clearCart}
        className="w-full bg-gray-400 text-white py-2 rounded hover:bg-gray-500 mb-2"
      >
        Limpiar carrito
      </button>
    </div>
  );
}
