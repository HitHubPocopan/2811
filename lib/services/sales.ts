import { supabase } from '@/lib/supabase';
import { Sale, SaleItem, DashboardStats, POSDashboardStats, PaymentMethod, PaymentBreakdown } from '@/lib/types';

const POS_NAMES: Record<number, string> = {
  1: 'Costa del Este',
  2: 'Mar de las Pampas',
  3: 'Costa Esmeralda',
};

export const salesService = {
  async createSale(
    posId: string,
    posNumber: number,
    items: SaleItem[],
    total: number,
    paymentMethod?: PaymentMethod,
    paymentBreakdown?: PaymentBreakdown
  ): Promise<Sale | null> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .insert([
          {
            pos_id: posId,
            pos_number: posNumber,
            total,
            items,
            payment_method: paymentMethod,
            payment_breakdown: paymentBreakdown,
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

  async deleteSale(saleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);

      if (error) {
        return false;
      }

      return true;
    } catch {
      return false;
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

  async getTodaySalesTotal(posNumber: number): Promise<number> {
    try {
      const now = new Date();
      const argentinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
      
      let startOfDay = new Date(argentinaTime);
      startOfDay.setHours(3, 0, 0, 0);
      
      if (argentinaTime.getHours() < 3) {
        startOfDay.setDate(startOfDay.getDate() - 1);
      }
      
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .eq('pos_number', posNumber)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (error || !sales) {
        return 0;
      }

      return sales.reduce((sum, sale) => sum + sale.total, 0);
    } catch {
      return 0;
    }
  },

  async getTodaySalesCombined(): Promise<number> {
    try {
      const now = new Date();
      const argentinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
      
      let startOfDay = new Date(argentinaTime);
      startOfDay.setHours(3, 0, 0, 0);
      
      if (argentinaTime.getHours() < 3) {
        startOfDay.setDate(startOfDay.getDate() - 1);
      }
      
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (error || !sales) {
        return 0;
      }

      return sales.reduce((sum, sale) => sum + sale.total, 0);
    } catch {
      return 0;
    }
  },

  async getSalesPerDay(days = 30): Promise<Array<{ date: string; total: number; pos1: number; pos2: number; pos3: number }>> {
    try {
      const now = new Date();
      const argentinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
      const startDate = new Date(argentinaTime);
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(3, 0, 0, 0);

      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error || !sales) {
        return [];
      }

      const salesByDay: Record<string, { total: number; pos1: number; pos2: number; pos3: number }> = {};

      sales.forEach((sale) => {
        const saleDate = new Date(sale.created_at);
        const saleDateArg = new Date(saleDate.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
        
        let dayStart = new Date(saleDateArg);
        dayStart.setHours(3, 0, 0, 0);
        
        if (saleDateArg.getHours() < 3) {
          dayStart.setDate(dayStart.getDate() - 1);
        }

        const dateKey = dayStart.toISOString().split('T')[0];
        
        if (!salesByDay[dateKey]) {
          salesByDay[dateKey] = { total: 0, pos1: 0, pos2: 0, pos3: 0 };
        }

        salesByDay[dateKey].total += sale.total;
        if (sale.pos_number === 1) {
          salesByDay[dateKey].pos1 += sale.total;
        } else if (sale.pos_number === 2) {
          salesByDay[dateKey].pos2 += sale.total;
        } else if (sale.pos_number === 3) {
          salesByDay[dateKey].pos3 += sale.total;
        }
      });

      return Object.entries(salesByDay)
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch {
      return [];
    }
  },

  async getSalesByDayAndPos(posNumber: number, days = 30): Promise<Array<{ date: string; total: number }>> {
    try {
      const now = new Date();
      const argentinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
      const startDate = new Date(argentinaTime);
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(3, 0, 0, 0);

      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .eq('pos_number', posNumber)
        .gte('created_at', startDate.toISOString());

      if (error || !sales) {
        return [];
      }

      const salesByDay: Record<string, number> = {};

      sales.forEach((sale) => {
        const saleDate = new Date(sale.created_at);
        const saleDateArg = new Date(saleDate.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
        
        let dayStart = new Date(saleDateArg);
        dayStart.setHours(3, 0, 0, 0);
        
        if (saleDateArg.getHours() < 3) {
          dayStart.setDate(dayStart.getDate() - 1);
        }

        const dateKey = dayStart.toISOString().split('T')[0];
        
        if (!salesByDay[dateKey]) {
          salesByDay[dateKey] = 0;
        }

        salesByDay[dateKey] += sale.total;
      });

      return Object.entries(salesByDay)
        .map(([date, total]) => ({
          date,
          total,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch {
      return [];
    }
  },

  async getProductsByDayAndPos(posNumber: number, date: string): Promise<Array<{ product_name: string; quantity: number; subtotal: number }>> {
    try {
      const dayStart = new Date(date + 'T03:00:00');
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const { data: sales, error } = await supabase
        .from('sales')
        .select('*')
        .eq('pos_number', posNumber)
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString());

      if (error || !sales) {
        return [];
      }

      const productCounts: Record<string, { product_name: string; quantity: number; subtotal: number }> = {};

      sales.forEach((sale) => {
        sale.items.forEach((item: SaleItem) => {
          if (!productCounts[item.product_id]) {
            productCounts[item.product_id] = {
              product_name: item.product_name,
              quantity: 0,
              subtotal: 0,
            };
          }
          productCounts[item.product_id].quantity += item.quantity;
          productCounts[item.product_id].subtotal += item.subtotal;
        });
      });

      return Object.values(productCounts)
        .sort((a, b) => b.quantity - a.quantity);
    } catch {
      return [];
    }
  },

  async getAllProductsSoldByPos(posId: string, fromDate?: string): Promise<Record<string, Array<{ product_name: string; quantity: number }>>> {
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .eq('pos_id', posId);

      if (fromDate) {
        const startDate = new Date(fromDate + 'T00:00:00');
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: sales, error } = await query;

      if (error || !sales) {
        return {};
      }

      const { data: products } = await supabase
        .from('products')
        .select('id, name, category');

      const productCategoryMap: Record<string, string> = {};
      if (products) {
        products.forEach((product: { id: string; name: string; category?: string }) => {
          productCategoryMap[product.id] = product.category || 'Sin categoría';
        });
      }

      const productsByCategory: Record<string, Record<string, number>> = {};

      sales.forEach((sale) => {
        sale.items.forEach((item: SaleItem) => {
          const category = productCategoryMap[item.product_id] || 'Sin categoría';
          
          if (!productsByCategory[category]) {
            productsByCategory[category] = {};
          }
          
          if (!productsByCategory[category][item.product_name]) {
            productsByCategory[category][item.product_name] = 0;
          }
          
          productsByCategory[category][item.product_name] += item.quantity;
        });
      });

      const result: Record<string, Array<{ product_name: string; quantity: number }>> = {};
      
      Object.keys(productsByCategory).sort().forEach((category) => {
        result[category] = Object.entries(productsByCategory[category])
          .map(([name, qty]) => ({ product_name: name, quantity: qty }))
          .sort((a, b) => b.quantity - a.quantity);
      });

      return result;
    } catch {
      return {};
    }
  },
};
