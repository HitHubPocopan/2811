import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Expense, ExpenseCategory, ExpenseItem } from '@/lib/types';

export const expenseService = {
  async createExpense(
    createdBy: string,
    category: ExpenseCategory,
    items: ExpenseItem[],
    subtotal: number,
    total: number,
    posNumber?: number,
    shippingCost?: number,
    notes?: string
  ): Promise<Expense | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('egresos')
        .insert([
          {
            created_by: createdBy,
            pos_number: posNumber || null,
            category,
            items,
            subtotal,
            shipping_cost: shippingCost || 0,
            total,
            notes: notes || null,
            status: 'pendiente',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating expense:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      return null;
    }
  },

  async getExpenseById(expenseId: string): Promise<Expense | null> {
    try {
      const { data, error } = await supabase
        .from('egresos')
        .select('*')
        .eq('id', expenseId)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  },

  async getExpensesByAdmin(limit = 100): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('egresos')
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

  async getExpensesByPos(posNumber: number, limit = 100): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('egresos')
        .select('*')
        .eq('pos_number', posNumber)
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

  async getExpensesByCategory(category: ExpenseCategory, limit = 100): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('egresos')
        .select('*')
        .eq('category', category)
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

  async getExpensesByStatus(status: 'pendiente' | 'aprobado' | 'rechazado', limit = 100): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('egresos')
        .select('*')
        .eq('status', status)
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

  async updateExpenseStatus(
    expenseId: string,
    status: 'pendiente' | 'aprobado' | 'rechazado'
  ): Promise<Expense | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('egresos')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', expenseId)
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

  async updateExpense(
    expenseId: string,
    updates: {
      category?: string;
      items?: ExpenseItem[];
      subtotal?: number;
      shipping_cost?: number;
      total?: number;
      notes?: string;
      pos_number?: number | null;
      payment_status?: 'paid' | 'unpaid';
      check_date?: string | null;
    }
  ): Promise<Expense | null> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.items !== undefined) updateData.items = updates.items;
      if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal;
      if (updates.shipping_cost !== undefined) updateData.shipping_cost = updates.shipping_cost;
      if (updates.total !== undefined) updateData.total = updates.total;
      if (updates.notes !== undefined) updateData.notes = updates.notes || null;
      if (updates.pos_number !== undefined) updateData.pos_number = updates.pos_number || null;
      if (updates.payment_status !== undefined) updateData.payment_status = updates.payment_status;
      if (updates.check_date !== undefined) updateData.check_date = updates.check_date || null;

      const { data, error } = await supabaseAdmin
        .from('egresos')
        .update(updateData)
        .eq('id', expenseId)
        .select()
        .single();

      if (error) {
        console.error('Error updating expense:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      return null;
    }
  },

  async getTotalExpensesByCategory(): Promise<Record<ExpenseCategory, number>> {
    try {
      const { data, error } = await supabase
        .from('egresos')
        .select('category, total')
        .eq('status', 'aprobado');

      if (error) {
        return {
          'Compra de Inventario': 0,
          'Expensas': 0,
          'Luz': 0,
          'Internet': 0,
          'Agua': 0,
          'Otros': 0,
        };
      }

      const result: Record<ExpenseCategory, number> = {
        'Compra de Inventario': 0,
        'Expensas': 0,
        'Luz': 0,
        'Internet': 0,
        'Agua': 0,
        'Otros': 0,
      };

      if (data && Array.isArray(data)) {
        data.forEach((expense: Expense) => {
          const category = expense?.category as ExpenseCategory;
          const total = expense?.total || 0;
          if (category && category in result) {
            result[category] += total;
          }
        });
      }

      return result;
    } catch {
      return {
        'Compra de Inventario': 0,
        'Expensas': 0,
        'Luz': 0,
        'Internet': 0,
        'Agua': 0,
        'Otros': 0,
      };
    }
  },

  async getTotalExpensesByPos(): Promise<Record<number, number>> {
    try {
      const { data, error } = await supabase
        .from('egresos')
        .select('pos_number, total')
        .eq('status', 'aprobado')
        .not('pos_number', 'is', null);

      if (error) {
        return {};
      }

      const result: Record<number, number> = {};

      (data || []).forEach((expense: Expense) => {
        if (expense.pos_number) {
          result[expense.pos_number] = (result[expense.pos_number] || 0) + expense.total;
        }
      });

      return result;
    } catch {
      return {};
    }
  },

  async getTotalExpenses(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('egresos')
        .select('total')
        .eq('status', 'aprobado');

      if (error) {
        return 0;
      }

      return (data || []).reduce((sum, exp) => sum + (exp.total || 0), 0);
    } catch {
      return 0;
    }
  },
};
