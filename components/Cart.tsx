'use client';

import { useCartStore } from '@/lib/store';
import { Product } from '@/lib/types';
import { useMemo } from 'react';

export function Cart({ products }: { products: Product[] }) {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();

  const total = useMemo(() => 
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full items-center justify-center text-center p-8 transition-all">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-2xl grayscale opacity-30">🛒</div>
        <p className="font-bold text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Carrito Vacío</p>
        <p className="text-[10px] text-gray-300 uppercase font-bold tracking-widest">Agrega productos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden transition-all">
      {/* Header fijo */}
      <div className="flex-shrink-0 p-5 border-b border-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Carrito</h2>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Venta en proceso</p>
          </div>
          <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-orange-100">
            {items.length} {items.length === 1 ? 'Ítem' : 'Ítems'}
          </span>
        </div>
      </div>
      
      {/* Área scrolleable de productos */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-100 scrollbar-track-transparent">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl border border-gray-100 gap-3 group transition-all hover:bg-white hover:shadow-md hover:border-orange-100"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[11px] uppercase tracking-tight text-gray-800 truncate mb-1">{item.product_name || 'Producto desconocido'}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400">${item.price.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-300">×</span>
                  <span className="text-[10px] font-bold text-orange-500">{item.quantity}</span>
                  <span className="text-[10px] text-gray-300">=</span>
                  <span className="text-[11px] font-bold text-gray-900">
                    ${(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center bg-white border border-gray-100 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                    className="px-2 py-1 hover:bg-gray-50 text-gray-400 transition-colors"
                  >-</button>
                  <span className="px-2 text-[10px] font-bold text-gray-700 w-6 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                    className="px-2 py-1 hover:bg-gray-50 text-gray-400 transition-colors"
                  >+</button>
                </div>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  aria-label="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer fijo con total y botones */}
      <div className="flex-shrink-0 border-t border-gray-50 p-5 bg-gray-50/30">
        <div className="flex justify-between items-center mb-5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Total Final</span>
          <span className="text-xl font-bold text-gray-900 tracking-tight">${total.toLocaleString()}</span>
        </div>

        <button
          onClick={clearCart}
          className="w-full text-[9px] font-bold text-gray-400 uppercase tracking-widest py-2 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
        >
          Limpiar Todo
        </button>
      </div>
    </div>
  );
}
