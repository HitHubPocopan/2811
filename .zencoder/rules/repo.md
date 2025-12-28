---
description: Repository Information Overview
alwaysApply: true
---

# POS System Information

## Summary

A full-stack Point of Sale (POS) and inventory management system built with Next.js and Supabase. Features include admin dashboard for inventory/expense management, multiple POS terminals for checkout, sales tracking, financial reporting, and import/export functionality. Supports role-based access (admin and POS operators), multiple payment methods, and real-time inventory updates.

## Structure

- **app/** - Next.js App Router pages (authentication, admin dashboard, POS operations, API routes)
- **components/** - Reusable React components (Navbar, Cart)
- **lib/** - Core business logic with services, types, state management, and Supabase client
- **database/** - PostgreSQL schema and migration scripts
- **tests/** - End-to-end tests with Playwright
- **public/** - Static assets
- **Documentation files** - Setup, deployment, testing guides

## Language & Runtime

**Language**: TypeScript 5  
**Runtime**: Node.js (via Next.js)  
**Framework**: Next.js 16.0.7  
**React Version**: 19.2.1  
**Build System**: Next.js  
**Package Manager**: npm

## Dependencies

**Main Dependencies**:
- `@supabase/auth-helpers-nextjs` (0.15.0) - Supabase authentication integration
- `@supabase/supabase-js` (2.86.0) - Supabase client for database and auth
- `zustand` (5.0.8) - State management
- `recharts` (3.5.1) - Charts and graphs for dashboards
- `date-fns` (4.1.0) - Date utilities
- `html2canvas` (1.4.1) - Screenshot/PDF generation
- `jspdf` (3.0.4) - PDF creation
- `xlsx` (0.18.5) - Excel import/export
- `react-dom` (19.2.1) - React rendering

**Development Dependencies**:
- `@playwright/test` (1.57.0) - E2E testing
- `tailwindcss` (4) - CSS framework
- `@tailwindcss/postcss` (4) - Tailwind PostCSS integration
- `eslint` (9) with `eslint-config-next` - Code linting
- TypeScript, React and Node type definitions

## Build & Installation

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Production server
npm start

# Code linting
npm run lint
```

## Database

**Backend**: Supabase (PostgreSQL)

**Main Tables**:
- `users` - Users with roles (admin/pos), credentials, pos_number
- `products` - Inventory with pricing, stock, categories
- `sessions` - Active user sessions with token-based auth
- `sales` - Transaction records with items and payment breakdown
- `purchase_records` - Merchandise purchases with cost tracking
- `expenses` - Expense tracking by category with approval workflow

**Schema Location**: `database/schema.sql` (includes test data insertion)

**Setup**: Apply schema via Supabase SQL Editor

## Main Files & Entry Points

**Application Entry**: `app/page.tsx` - Login page  
**Admin Routes**: `app/admin/` - Dashboard, products, debts, expenses  
**POS Routes**: `app/pos/` - Catalog, checkout, confirmation, sales history, stats  
**API Routes**: `app/api/` - Backend endpoints for egresos, purchases, sales  
**Services**: `lib/services/` - auth, products, sales, expenses, purchases, import-export  
**State Store**: `lib/store.ts` - Zustand store for cart and user state  
**Database Client**: `lib/supabase.ts` - Supabase initialization

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing

**Framework**: Playwright 1.57.0  
**Test Location**: `tests/` directory  
**Test Files**: `auth.spec.ts`, `admin.spec.ts`, `pos-checkout.spec.ts`  
**Configuration**: `playwright.config.ts` (Chromium, baseURL: http://localhost:3000)  

**Run Commands**:
```bash
npm test                # Run all tests
npm run test:ui        # Interactive UI mode
npm run test:headed    # Visible browser
npm run test:debug     # Debug mode
```

**Setup**: Tests require `npm run dev` running and seed data in Supabase

## Docker

No Dockerfile or Docker Compose found in repository.

## Key Features

- **Role-based access**: Admin (inventory/expense management) and POS (sales operations)
- **Multi-POS support**: Multiple checkout terminals per location
- **Payment flexibility**: Cash, transfer, QR, debit, credit, mixed payment tracking
- **Inventory management**: Real-time stock updates, purchase cost tracking
- **Financial reporting**: Sales analytics, expense categorization, approval workflows
- **Export capabilities**: CSV/Excel export for products, sales, purchases
- **Session management**: Token-based authentication with 30-day expiry
