'use client';

import { useCartStore, useAuthStore } from '@/lib/store';
import { Product } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { salesService } from '@/lib/services/sales';

export function Cart({ products }: { products: Product[] }) {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    const fetchTodayTotal = async () => {
      if (user && user.role === 'pos' && user.pos_number) {
        const total = await salesService.getTodaySalesTotal(user.pos_number);
        setTodayTotal(total);
      }
    };

    fetchTodayTotal();

    const interval = setInterval(fetchTodayTotal, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Create a product map for faster lookups
  const productMap = useMemo(() => 
    products.reduce((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {} as Record<string, Product>),
    [products]
  );

  const total = useMemo(() => 
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const getProductName = (productId: string) => {
    return productMap[productId]?.name || 'Producto desconocido';
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId);
    } else if (newQuantity > 100) {
      updateQuantity(productId, 100);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow flex flex-col h-full items-center justify-center text-center text-gray-600 p-6">
        <p className="text-3xl mb-3">🛒</p>
        <p className="font-semibold text-lg mb-1">El carrito está vacío</p>
        <p className="text-sm text-gray-500">Agrega algunos productos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full">
      {/* Header fijo con total del día */}
      <div className="flex-shrink-0 p-4 border-b-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="mb-3 pb-3 border-b border-orange-100">
          <p className="text-xs font-semibold text-gray-600 mb-1">VENDIDO HOY</p>
          <p className="text-2xl font-bold text-orange-600">${todayTotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Carrito</h2>
          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>
      </div>
      
      {/* Área scrolleable de productos */}
      <div className="flex-1 overflow-hidden"> {/* Contenedor para el scroll */}
        <div className="h-full overflow-y-auto p-6 space-y-4">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{getProductName(item.product_id)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  ${item.price.toFixed(2)} × {item.quantity} = 
                  <span className="font-semibold ml-1">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value) || 1)}
                  onBlur={(e) => {
                    if (!e.target.value || parseInt(e.target.value) < 1) {
                      handleQuantityChange(item.product_id, 1);
                    }
                  }}
                  className="w-16 p-2 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors duration-200 text-xs font-medium min-w-[32px]"
                  aria-label="Eliminar producto"
                  title="Eliminar producto"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer fijo con total y botones */}
      <div className="flex-shrink-0 border-t border-gray-200 p-6 bg-gradient-to-r from-orange-50 to-slate-50">
        <div className="flex justify-between text-lg font-bold mb-4">
          <span>Total:</span>
          <span className="text-orange-600">${total.toFixed(2)}</span>
        </div>

        <button
          onClick={clearCart}
          className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200 text-sm font-medium"
        >
          Limpiar carrito
        </button>
      </div>
    </div>
  );
}