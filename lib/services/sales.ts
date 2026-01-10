import { supabase } from '@/lib/supabase';
import { Sale, SaleItem, DashboardStats, POSDashboardStats, PaymentMethod, PaymentBreakdown } from '@/lib/types';

const POS_NAMES: Record<number, string> = {
  1: 'Costa del Este',
  2: 'Mar de las Pampas',
  3: 'Costa Esmeralda',
};

async function fetchAllFromSupabase(
  table: string,
  select: string,
  filterCallback?: (query: any) => any
): Promise<any[]> {
  const allData: any[] = [];
  let from = 0;
  const step = 1000;

  while (true) {
    let query = supabase.from(table).select(select);
    if (filterCallback) {
      query = filterCallback(query);
    }
    
    const { data, error } = await query
      .range(from, from + step - 1)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error fetching from ${table}:`, error);
      return allData; // Return what we have
    }

    if (!data || data.length === 0) break;
    
    allData.push(...data);
    if (data.length < step) break;
    from += step;
  }

  return allData;
}

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

  async getSalesByPosNumber(posNumber: number, limit = 1000, startDate?: string): Promise<Sale[]> {
    try {
      let allData: Sale[] = [];
      let from = 0;
      const step = 1000;

      while (allData.length < limit) {
        const currentStep = Math.min(step, limit - allData.length);
        let query = supabase
          .from('sales')
          .select('*')
          .eq('pos_number', posNumber);
        
        if (startDate) {
          query = query.gte('created_at', startDate);
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .range(from, from + currentStep - 1);

        if (error) {
          console.error(`Error fetching sales for POS ${posNumber}:`, error);
          break;
        }

        if (!data || data.length === 0) break;
        
        allData.push(...data as Sale[]);
        if (data.length < currentStep) break;
        from += currentStep;
      }

      return allData;
    } catch (error) {
      console.error('Error in getSalesByPosNumber:', error);
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

  async getAllSales(limit = 1000): Promise<Sale[]> {
    try {
      let allData: Sale[] = [];
      let from = 0;
      const step = 1000;

      while (allData.length < limit) {
        const currentStep = Math.min(step, limit - allData.length);
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + currentStep - 1);

        if (error) {
          console.error('Error fetching all sales:', error);
          break;
        }

        if (!data || data.length === 0) break;
        
        allData.push(...data as Sale[]);
        if (data.length < currentStep) break;
        from += currentStep;
      }

      return allData;
    } catch (error) {
      console.error('Error in getAllSales:', error);
      return [];
    }
  },

  async getPosDashboard(posId: string, posNumber: number): Promise<POSDashboardStats | null> {
    try {
      const sales = await fetchAllFromSupabase(
        'sales',
        'total, items, created_at',
        (q) => q.eq('pos_number', posNumber)
      );

      if (!sales || sales.length === 0) {
        // Return empty stats instead of null to keep UI happy
        return {
          pos_number: posNumber,
          pos_name: POS_NAMES[posNumber] || `POS ${posNumber}`,
          total_sales: 0,
          total_revenue: 0,
          total_items_sold: 0,
          top_products: [],
          last_sales: [],
        };
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

      // Sort by created_at desc for last_sales
      const sortedSales = [...sales].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return {
        pos_number: posNumber,
        pos_name: POS_NAMES[posNumber] || `POS ${posNumber}`,
        total_sales,
        total_revenue,
        total_items_sold,
        top_products,
        last_sales: sortedSales.slice(0, 10) as any,
      };
    } catch (error) {
      console.error('Error in getPosDashboard:', error);
      return null;
    }
  },

  async getAdminDashboard(): Promise<DashboardStats | null> {
    try {
      const sales = await fetchAllFromSupabase('sales', 'total, items');

      if (!sales) {
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
    } catch (error) {
      console.error('Error in getAdminDashboard:', error);
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

      const sales = await fetchAllFromSupabase(
        'sales',
        'total',
        (q) => q.eq('pos_number', posNumber)
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString())
      );

      if (!sales) {
        return 0;
      }

      return sales.reduce((sum, sale) => sum + sale.total, 0);
    } catch (error) {
      console.error('Error in getTodaySalesTotal:', error);
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

      const sales = await fetchAllFromSupabase(
        'sales',
        'total',
        (q) => q.gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString())
      );

      if (!sales) {
        return 0;
      }

      return sales.reduce((sum, sale) => sum + sale.total, 0);
    } catch (error) {
      console.error('Error in getTodaySalesCombined:', error);
      return 0;
    }
  },

  async getSalesPerDay(days = 30): Promise<Array<{ date: string; total: number; pos1: number; pos2: number; pos3: number }>> {
    try {
      const now = new Date();
      // Calculate start date in Argentina time
      const startDateArg = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
      startDateArg.setDate(startDateArg.getDate() - days);
      startDateArg.setHours(3, 0, 0, 0);

      const sales = await fetchAllFromSupabase(
        'sales',
        'total, created_at, pos_number',
        (q) => q.gte('created_at', startDateArg.toISOString())
      );

      if (!sales) {
        return [];
      }

      const salesByDay: Record<string, { total: number; pos1: number; pos2: number; pos3: number }> = {};

      sales.forEach((sale) => {
        const saleDate = new Date(sale.created_at);
        
        // Get Argentine hour and date
        const hourInArg = parseInt(saleDate.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }));
        const dateStr = saleDate.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
        
        let [year, month, day] = dateStr.split('-').map(Number);
        let businessDate = new Date(year, month - 1, day);
        
        // 3 AM rule: if before 3 AM, it's the previous business day
        if (hourInArg < 3) {
          businessDate.setDate(businessDate.getDate() - 1);
        }

        const dateKey = `${businessDate.getFullYear()}-${String(businessDate.getMonth() + 1).padStart(2, '0')}-${String(businessDate.getDate()).padStart(2, '0')}`;
        
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
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error in getSalesPerDay:', error);
      return [];
    }
  },

  async getSalesByDayAndPos(posNumber: number, days = 30): Promise<Array<{ date: string; total: number }>> {
    try {
      const now = new Date();
      const startDateArg = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
      startDateArg.setDate(startDateArg.getDate() - days);
      startDateArg.setHours(3, 0, 0, 0);

      const sales = await fetchAllFromSupabase(
        'sales',
        'total, created_at',
        (q) => q.eq('pos_number', posNumber).gte('created_at', startDateArg.toISOString())
      );

      if (!sales) {
        return [];
      }

      const salesByDay: Record<string, number> = {};

      sales.forEach((sale) => {
        const saleDate = new Date(sale.created_at);
        const hourInArg = parseInt(saleDate.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }));
        const dateStr = saleDate.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
        
        let [year, month, day] = dateStr.split('-').map(Number);
        let businessDate = new Date(year, month - 1, day);
        
        if (hourInArg < 3) {
          businessDate.setDate(businessDate.getDate() - 1);
        }

        const dateKey = `${businessDate.getFullYear()}-${String(businessDate.getMonth() + 1).padStart(2, '0')}-${String(businessDate.getDate()).padStart(2, '0')}`;
        
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
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error in getSalesByDayAndPos:', error);
      return [];
    }
  },

  async getProductsByDayAndPos(posNumber: number, date: string): Promise<Array<{ product_name: string; quantity: number; subtotal: number }>> {
    try {
      const dayStart = new Date(date + 'T03:00:00');
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const sales = await fetchAllFromSupabase(
        'sales',
        '*',
        (q) => q.eq('pos_number', posNumber)
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString())
      );

      if (!sales) {
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

      return Object.values(productCounts).sort((a, b) => b.quantity - a.quantity);
    } catch (error) {
      console.error('Error in getProductsByDayAndPos:', error);
      return [];
    }
  },

  async getAllProductsSoldByPos(posId: string, fromDate?: string): Promise<Record<string, Array<{ product_name: string; quantity: number }>>> {
    try {
      const sales = await fetchAllFromSupabase(
        'sales',
        '*',
        (q) => {
          let query = q.eq('pos_id', posId);
          if (fromDate) {
            const startDate = new Date(fromDate + 'T00:00:00');
            query = query.gte('created_at', startDate.toISOString());
          }
          return query;
        }
      );

      if (!sales) {
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
    } catch (error) {
      console.error('Error in getAllProductsSoldByPos:', error);
      return {};
    }
  },
};
