import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import crypto from 'crypto';

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        return null;
      }

      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      if (data.password_hash !== passwordHash) {
        return null;
      }

      const token = crypto.randomBytes(32).toString('hex');

      const { error: tokenError } = await supabase
        .from('sessions')
        .insert([{ user_id: data.id, token, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }]);

      if (tokenError) {
        return null;
      }

      return { user: data, token };
    } catch {
      return null;
    }
  },

  async register(
    email: string,
    password: string,
    role: 'admin' | 'pos',
    posNumber?: number
  ): Promise<User | null> {
    try {
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            password_hash: passwordHash,
            role,
            pos_number: posNumber,
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

  async validateToken(token: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user_id)
        .single();

      if (userError) {
        return null;
      }

      return user;
    } catch {
      return null;
    }
  },

  async logout(token: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('token', token);

      return !error;
    } catch {
      return false;
    }
  },
};
