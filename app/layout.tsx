import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { OfflineSync } from '@/components/OfflineSync';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Pocopán Juguetería',
  description: 'Sistema de gestión de ventas para Pocopán Juguetería',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans font-light text-slate-950 antialiased`}>
        {children}
        <OfflineSync />
      </body>
    </html>
  );
}
