'use client';

import { useEffect, useState } from 'react';
import { useOfflineStore } from '@/lib/store';
import { salesService } from '@/lib/services/sales';

export function OfflineSync() {
  const { pendingSales, removePendingSale } = useOfflineStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && pendingSales.length > 0 && !isSyncing) {
      syncSales();
    }
  }, [isOnline, pendingSales, isSyncing]);

  const syncSales = async () => {
    setIsSyncing(true);
    
    // Process one by one to avoid overwhelming or conflicting
    for (const sale of pendingSales) {
      try {
        const result = await salesService.createSale(
          sale.posId,
          sale.posNumber,
          sale.items as any,
          sale.total,
          sale.paymentMethod as any,
          sale.paymentBreakdown
        );

        if (result) {
          removePendingSale(sale.id);
        }
      } catch (error) {
        console.error('Failed to sync sale:', error);
        // Stop syncing if we hit an error to try later
        break;
      }
    }

    setIsSyncing(false);
  };

  if (pendingSales.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce">
      <div className={`px-4 py-2 rounded-full shadow-lg text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}>
        <span>{isOnline ? '🔄 Sincronizando' : '📡 Offline'}</span>
        <span className="bg-white/20 px-2 py-0.5 rounded-full">{pendingSales.length}</span>
      </div>
    </div>
  );
}
