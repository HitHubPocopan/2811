'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authService } from '@/lib/services/auth';
import { useState, useMemo, useEffect } from 'react';
import { predictionService } from '@/lib/services/prediction';
import { weatherService, WeatherCondition } from '@/lib/services/weather';

export function Navbar() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherCondition>('sunny');

  useEffect(() => {
    if (!user) return;
    
    // Fetch weather for the current POS or default to Costa Esmeralda (POS 3)
    const pos = user.role === 'admin' ? 3 : (user.pos_number || 1);
    weatherService.getCurrentWeather(pos).then(setWeather);
  }, [user]);

  const forecast = useMemo(() => {
    if (!user) return null;
    const pos = user.role === 'admin' ? 3 : (user.pos_number || 1);
    return predictionService.getForecast(pos, weather);
  }, [user, weather]);

  const handleLogout = async () => {
    if (token) {
      await authService.logout(token);
    }
    logout();
    router.push('/');
  };

  const whatsappButtons = useMemo(() => {
    if (!user || user.role === 'admin') return [];
    
    const posContacts = [
      { pos: 1, name: 'Costa del Este', phone: '5492257542170' },
      { pos: 2, name: 'Mar de las Pampas', phone: '5492257542171' },
      { pos: 3, name: 'Costa Esmeralda', phone: '5492257660073' },
    ];

    return posContacts.filter(p => p.pos !== user.pos_number);
  }, [user]);

  if (!user) {
    return null;
  }

  const navItems = user.role === 'admin' 
    ? [
        { href: '/admin/dashboard', label: 'Dashboard' },
        { href: '/admin/products', label: 'Productos' },
        { href: '/admin/egresos', label: 'Gastos' }
      ]
    : [
        { href: '/pos/catalog', label: 'Catálogo' },
        { href: '/pos/sales', label: 'Historial' },
        { href: '/pos/stats', label: 'Estadísticas' }
      ];

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50" style={{ WebkitFontSmoothing: 'antialiased' }}>
      <div className="px-3 sm:px-6 py-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6 flex-shrink-0">
            <Link href="/" className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900 whitespace-nowrap">
              SISTEMA<span className="text-orange-500">VENTAS</span>
            </Link>
            
            {forecast && (
              <div className="hidden md:flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Pronóstico:</span>
                <div className="flex gap-4 text-[11px] font-semibold text-gray-600">
                  <div className="flex items-center gap-1.5" title={`Mañana: ${forecast.morning.status}`}>
                    <span className="opacity-70">Mañana</span>
                    <span>{forecast.morning.icon}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title={`Tarde: ${forecast.afternoon.status}`}>
                    <span className="opacity-70">Tarde</span>
                    <span>{forecast.afternoon.icon}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title={`Noche: ${forecast.night.status}`}>
                    <span className="opacity-70">Noche</span>
                    <span>{forecast.night.icon}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs font-bold uppercase tracking-wide text-gray-500 hover:text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-lg transition-all"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
            {whatsappButtons.map(btn => (
              <a
                key={btn.pos}
                href={`https://wa.me/${btn.phone}?text=Hola%20${encodeURIComponent(btn.name)},%20te%20envío%20un%20aviso%20desde%20el%20sistema%20de%20ventas.`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase flex items-center gap-2 transition-all border border-emerald-100"
              >
                <span className="text-xs">💬</span>
                <span>Aviso {btn.name}</span>
              </a>
            ))}
            <div className="h-6 w-px bg-gray-100 mx-1"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {user.role === 'admin' ? 'Admin' : user.name || `POS ${user.pos_number}`}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-all"
            >
              Salir
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden mt-2 py-2 border-t border-gray-100 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-orange-500 transition-all text-sm font-semibold"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
              {whatsappButtons.map(btn => (
                <a
                  key={btn.pos}
                  href={`https://wa.me/${btn.phone}?text=Hola%20${encodeURIComponent(btn.name)},%20te%20envío%20un%20aviso%20desde%20el%20sistema%20de%20ventas.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase transition text-center border border-emerald-100"
                >
                  💬 Enviar Aviso a {btn.name}
                </a>
              ))}
              <div className="px-4 py-2 bg-gray-50 rounded-xl mx-2">
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest text-center">
                  Sesión: {user.role === 'admin' ? 'Admin' : user.name || `POS ${user.pos_number}`}
                </p>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="w-full text-center text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
