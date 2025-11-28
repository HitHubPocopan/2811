import { supabase } from '@/lib/supabase';
import { Sale, SaleItem, DashboardStats, POSDashboardStats } from '@/lib/types';

const POS_NAMES: Record<number, string> = {
  1: 'Costa del Este',
  2: 'Mar de las Pampas',
  3: 'Costa Esmeralda',
};

export const salesService = {
  async createSale(posId: string, posNumber: number, items: SaleItem[], total: number): Promise<Sale | null> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .insert([
          {
            pos_id: posId,
            pos_number: posNumber,
            total,
            items,
          },
        ])
        .select()
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  },

  async getSalesByPos(posId: string, limit = 50): Promise<Sale[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('pos_id', posId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return [];
      }

      return data || [];
    } catch {
      return [];
    }
  },

  async getAllSales(limit = 100): Promise<Sale[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return [];
      }

      return data || [];
    } catch {
      return [];
    }
  },

  async getPosDashboard(posId: string, posNumber: number): Promise<POSDashboardStats | null> {
    try {
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .eq('pos_number', posNumber);

      if (error || !sales) {
        return null;
      }

      const total_sales = sales.length;
      const total_revenue = sales.reduce((sum, sale) => sum + sale.total, 0);

      const itemCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};

      sales.forEach((sale) => {
        sale.items.forEach((item: SaleItem) => {
          if (!itemCounts[item.product_id]) {
            itemCounts[item.product_id] = {
              name: item.product_name,
              quantity: 0,
              revenue: 0,
            };
          }
          itemCounts[item.product_id].quantity += item.quantity;
          itemCounts[item.product_id].revenue += item.subtotal;
        });
      });

      const top_products = Object.values(itemCounts)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)
        .map((p) => ({
          product_name: p.name,
          quantity: p.quantity,
          revenue: p.revenue,
        }));

      const total_items_sold = Object.values(itemCounts).reduce((sum, item) => sum + item.quantity, 0);

      return {
        pos_number: posNumber,
        pos_name: POS_NAMES[posNumber] || `POS ${posNumber}`,
        total_sales,
        total_revenue,
        total_items_sold,
        top_products,
        last_sales: sales.slice(0, 10),
      };
    } catch {
      return null;
    }
  },

  async getAdminDashboard(): Promise<DashboardStats | null> {
    try {
      const { data: sales, error } = await supabase
        .from('sales')
        .select('*');

      if (error || !sales) {
        return null;
      }

      const total_sales = sales.length;
      const total_revenue = sales.reduce((sum, sale) => sum + sale.total, 0);

      const itemCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};

      sales.forEach((sale) => {
        sale.items.forEach((item: SaleItem) => {
          if (!itemCounts[item.product_id]) {
            itemCounts[item.product_id] = {
              name: item.product_name,
              quantity: 0,
              revenue: 0,
            };
          }
          itemCounts[item.product_id].quantity += item.quantity;
          itemCounts[item.product_id].revenue += item.subtotal;
        });
      });

      const top_products = Object.values(itemCounts)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 15)
        .map((p) => ({
          product_name: p.name,
          quantity: p.quantity,
          revenue: p.revenue,
        }));

      const total_items_sold = Object.values(itemCounts).reduce((sum, item) => sum + item.quantity, 0);

      return {
        total_sales,
        total_revenue,
        total_items_sold,
        top_products,
      };
    } catch {
      return null;
    }
  },
};
