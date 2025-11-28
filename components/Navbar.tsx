'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authService } from '@/lib/services/auth';

export function Navbar() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();

  const handleLogout = async () => {
    if (token) {
      await authService.logout(token);
    }
    logout();
    router.push('/');
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-orange-600 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold">
            Sistema de Ventas
          </Link>
          {user.role === 'admin' && (
            <>
              <Link href="/admin/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/admin/products" className="hover:underline">
                Productos
              </Link>
            </>
          )}
          {user.role === 'pos' && (
            <>
              <Link href="/pos/catalog" className="hover:underline">
                Catálogo
              </Link>
              <Link href="/pos/sales" className="hover:underline">
                Historial
              </Link>
              <Link href="/pos/stats" className="hover:underline">
                Estadísticas
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {user.role === 'admin' ? 'Admin' : user.name || `POS ${user.pos_number}`}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
