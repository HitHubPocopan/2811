export type UserRole = 'admin' | 'pos';

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'QR' | 'Débito' | 'Crédito' | 'Mixto';

export interface PaymentBreakdown {
  method1: PaymentMethod;
  amount1: number;
  method2: PaymentMethod;
  amount2: number;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  pos_number?: number;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category?: string;
  subcategory?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  pos_id: string;
  pos_number: number;
  total: number;
  items: SaleItem[];
  payment_method?: PaymentMethod;
  payment_breakdown?: PaymentBreakdown;
  created_at: string;
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface DashboardStats {
  total_sales: number;
  total_revenue: number;
  total_items_sold: number;
  top_products: { product_name: string; quantity: number; revenue: number }[];
}

export interface POSDashboardStats extends DashboardStats {
  pos_number: number;
  pos_name?: string;
  last_sales: Sale[];
}

export interface AdminDashboardStats extends DashboardStats {
  pos_stats: POSDashboardStats[];
  total_pos: number;
}

export interface PurchaseRecord {
  id: string;
  product_id: string;
  quantity: number;
  purchase_price: number;
  total_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory = 'Compra de Inventario' | 'Servicios' | 'Gastos Operativos' | 'Otros';

export interface ExpenseItem {
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Expense {
  id: string;
  created_by: string;
  pos_number?: number;
  category: ExpenseCategory;
  items: ExpenseItem[];
  subtotal: number;
  shipping_cost?: number;
  total: number;
  notes?: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  created_at: string;
  updated_at: string;
}
