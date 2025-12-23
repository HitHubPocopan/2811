'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authService } from '@/lib/services/auth';
import { useState } from 'react';

export function Navbar() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const navItems = user.role === 'admin' 
    ? [
        { href: '/admin/dashboard', label: 'Dashboard' },
        { href: '/admin/products', label: 'Productos' }
      ]
    : [
        { href: '/pos/catalog', label: 'Catálogo' },
        { href: '/pos/sales', label: 'Historial' },
        { href: '/pos/stats', label: 'Estadísticas' }
      ];

  return (
    <nav className="bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md" style={{ WebkitFontSmoothing: 'antialiased' }}>
      <div className="px-3 sm:px-6 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-base sm:text-lg font-bold whitespace-nowrap flex-shrink-0">
            Sistema de Ventas
          </Link>
          
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 hover:bg-orange-500 rounded transition flex-shrink-0"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>

          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium hover:bg-white hover:text-orange-600 px-3 py-2 rounded transition"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
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

        {menuOpen && (
          <div className="lg:hidden mt-3 pb-3 border-t border-orange-500 pt-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded hover:bg-orange-500 transition text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-orange-500 pt-2 mt-2">
              <p className="px-3 py-2 text-xs text-orange-100">
                {user.role === 'admin' ? 'Admin' : user.name || `POS ${user.pos_number}`}
              </p>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="w-full text-left bg-red-500 hover:bg-red-600 px-3 py-2 rounded text-sm font-semibold transition"
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
