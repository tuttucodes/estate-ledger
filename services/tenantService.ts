import { supabase } from "../lib/supabase";

export const tenantService = {
  async createTenant(userId: string, unitId: string) {
    const { data, error } = await supabase
      .from("tenants")
      .insert({ user_id: userId, unit_id: unitId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createRentAgreement(tenantId: string, rentAmount: number, dueDate: number, startDate: string) {
    const { data, error } = await supabase
      .from("rent_agreements")
      .insert({
        tenant_id: tenantId,
        rent_amount: rentAmount,
        due_date: dueDate,
        start_date: startDate
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getTenantByUserId(userId: string) {
    const { data, error } = await supabase.from("tenants").select("*").eq("user_id", userId).single();
    if (error) throw error;
    return data;
  },

  async getRentAgreement(tenantId: string) {
    const { data, error } = await supabase
      .from("rent_agreements")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("start_date", { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    return data;
  },

  async getOwnerForTenantUser(userId: string) {
    const tenant = await this.getTenantByUserId(userId);
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("property_id")
      .eq("id", tenant.unit_id)
      .single();
    if (unitError) throw unitError;

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("owner_id")
      .eq("id", unit.property_id)
      .single();
    if (propertyError) throw propertyError;

    const { data: owner, error: ownerError } = await supabase
      .from("users")
      .select("id, name, upi_id")
      .eq("id", property.owner_id)
      .single();
    if (ownerError) throw ownerError;
    return owner;
  }
};
