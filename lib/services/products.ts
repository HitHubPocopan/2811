import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';

export const productService = {
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        return [];
      }

      return data || [];
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  },

  async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
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

  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
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

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  async updateStock(id: string, quantity: number): Promise<boolean> {
    try {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', id)
        .single();

      if (fetchError || !product) {
        return false;
      }

      const { error } = await supabase
        .from('products')
        .update({ stock: product.stock - quantity })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null)
        .order('category');

      if (error) {
        return [];
      }

      const categories = Array.from(new Set(data?.map((p) => p.category).filter(Boolean)));
      return categories as string[];
    } catch {
      return [];
    }
  },

  async getSubcategories(category: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('subcategory')
        .eq('category', category)
        .not('subcategory', 'is', null)
        .order('subcategory');

      if (error) {
        return [];
      }

      const subcategories = Array.from(new Set(data?.map((p) => p.subcategory).filter(Boolean)));
      return subcategories as string[];
    } catch {
      return [];
    }
  },
};
