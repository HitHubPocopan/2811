'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOffline = searchParams.get('offline') === 'true';
  const { user } = useAuthStore();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 mt-12">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              {isOffline ? '¡Venta guardada (Offline)!' : '¡Venta completada!'}
            </h1>
            <p className="text-gray-600">
              {isOffline 
                ? 'La venta se ha guardado localmente y se sincronizará automáticamente cuando vuelvas a tener conexión.'
                : 'La venta ha sido registrada correctamente'}
            </p>
          </div>

          <button
            onClick={() => router.push('/pos/catalog')}
            className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition font-semibold"
          >
            Continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
}
