import { supabase } from '@/lib/supabase';
import { PurchaseRecord } from '@/lib/types';

export const purchaseService = {
  async createPurchase(
    productId: string,
    quantity: number,
    purchasePrice: number,
    notes?: string
  ): Promise<PurchaseRecord | null> {
    try {
      if (quantity <= 0 || purchasePrice <= 0) {
        return null;
      }

      const totalCost = quantity * purchasePrice;

      const { data, error } = await supabase
        .from('purchase_records')
        .insert([
          {
            product_id: productId,
            quantity,
            purchase_price: purchasePrice,
            total_cost: totalCost,
            notes,
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

  async getPurchasesByProduct(productId: string): Promise<PurchaseRecord[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_records')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    } catch {
      return [];
    }
  },

  async getAllPurchases(): Promise<PurchaseRecord[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    } catch {
      return [];
    }
  },

  async deletePurchase(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('purchase_records')
        .delete()
        .eq('id', id);

      if (error) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },
};
