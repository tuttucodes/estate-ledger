import { supabase } from "../lib/supabase";

export const expenseService = {
  async addExpense(propertyId: string, category: string, amount: number, notes?: string) {
    const { data, error } = await supabase
      .from("expenses")
      .insert({ property_id: propertyId, category, amount, notes: notes || null })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listOwnerExpenses(ownerId: string) {
    const { data, error } = await supabase
      .from("expenses")
      .select("*, properties!inner(*)")
      .eq("properties.owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }
};
