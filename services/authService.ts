import { supabase } from "../lib/supabase";
import { AppUser, UserRole } from "../types";

export const authService = {
  async signUp(params: { name: string; email: string; password: string; role: UserRole }) {
    const { name, email, password, role } = params;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }
      }
    });

    if (error) throw error;

    const userId = data.user?.id;
    if (userId) {
      const { error: upsertError } = await supabase.from("users").upsert({
        id: userId,
        name,
        email,
        role,
        upi_id: null
      });
      if (upsertError) throw upsertError;
    }
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentProfile(): Promise<AppUser | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
    if (error) throw error;
    return data;
  },

  async updateUpiId(userId: string, upiId: string) {
    const value = upiId.trim() || null;
    const { data, error } = await supabase
      .from("users")
      .update({ upi_id: value })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
