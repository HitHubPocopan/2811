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
    <nav className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 shadow-md" style={{ WebkitFontSmoothing: 'antialiased' }}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold">
            Sistema de Ventas
          </Link>
          {user.role === 'admin' && (
            <>
              <Link href="/admin/dashboard" className="text-sm font-medium hover:bg-white hover:text-orange-600 px-3 py-2 rounded transition">
                Dashboard
              </Link>
              <Link href="/admin/products" className="text-sm font-medium hover:bg-white hover:text-orange-600 px-3 py-2 rounded transition">
                Productos
              </Link>
            </>
          )}
          {user.role === 'pos' && (
            <>
              <Link href="/pos/catalog" className="text-sm font-medium hover:bg-white hover:text-orange-600 px-3 py-2 rounded transition">
                Catalogo
              </Link>
              <Link href="/pos/sales" className="text-sm font-medium hover:bg-white hover:text-orange-600 px-3 py-2 rounded transition">
                Historial
              </Link>
              <Link href="/pos/stats" className="text-sm font-medium hover:bg-white hover:text-orange-600 px-3 py-2 rounded transition">
                Estadisticas
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {user.role === 'admin' ? 'Admin' : user.name || `POS ${user.pos_number}`}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-semibold transition"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
