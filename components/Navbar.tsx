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
    <nav className="bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md" style={{ WebkitFontSmoothing: 'antialiased' }}>
      <div className="px-3 sm:px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link href="/" className="text-base sm:text-lg font-bold whitespace-nowrap">
              Sistema de Ventas
            </Link>
            
            {forecast && (
              <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Se Pronostica:</span>
                <div className="flex gap-4 text-[11px] font-medium">
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
            {whatsappButtons.map(btn => (
              <a
                key={btn.pos}
                href={`https://wa.me/${btn.phone}?text=Hola%20${encodeURIComponent(btn.name)},%20te%20envío%20un%20aviso%20desde%20el%20sistema%20de%20ventas.`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 transition-all shadow-sm border border-emerald-400/30"
              >
                <span>💬</span>
                <span>Aviso {btn.name}</span>
              </a>
            ))}
            <span className="text-sm font-medium border-l border-white/20 pl-4">
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
            <div className="border-t border-orange-500 pt-2 mt-2 space-y-2">
              {whatsappButtons.map(btn => (
                <a
                  key={btn.pos}
                  href={`https://wa.me/${btn.phone}?text=Hola%20${encodeURIComponent(btn.name)},%20te%20envío%20un%20aviso%20desde%20el%20sistema%20de%20ventas.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-emerald-500 hover:bg-emerald-600 px-3 py-2 rounded text-xs font-bold uppercase transition text-center"
                >
                  💬 Enviar Aviso a {btn.name}
                </a>
              ))}
              <p className="px-3 py-1 text-[10px] text-orange-100 uppercase font-bold tracking-widest opacity-60">
                Sesión: {user.role === 'admin' ? 'Admin' : user.name || `POS ${user.pos_number}`}
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
