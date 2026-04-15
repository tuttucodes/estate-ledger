import { supabase } from "../lib/supabase";

export const propertyService = {
  async createProperty(ownerId: string, name: string, location: string) {
    const { data, error } = await supabase
      .from("properties")
      .insert({ owner_id: ownerId, name, location })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listOwnerProperties(ownerId: string) {
    const { data, error } = await supabase.from("properties").select("*").eq("owner_id", ownerId);
    if (error) throw error;
    return data;
  },

  async createUnit(propertyId: string, name: string) {
    const { data, error } = await supabase
      .from("units")
      .insert({ property_id: propertyId, name })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listUnits(propertyId: string) {
    const { data, error } = await supabase.from("units").select("*").eq("property_id", propertyId);
    if (error) throw error;
    return data;
  }
};
