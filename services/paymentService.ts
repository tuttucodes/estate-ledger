import { supabase } from "../lib/supabase";
import { PaymentMethod, PaymentStatus } from "../types";

export const paymentService = {
  async listPaymentsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async listAllPaymentsForOwner(ownerId: string) {
    const { data, error } = await supabase
      .from("payments")
      .select("*, tenants!inner(*, units!inner(*, properties!inner(*)))")
      .eq("tenants.units.properties.owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async submitPayment(input: {
    tenantId: string;
    amount: number;
    method: PaymentMethod;
    utrId?: string;
    screenshotUrl?: string;
  }) {
    const { tenantId, amount, method, utrId, screenshotUrl } = input;
    const { data: existing, error: checkError } = await supabase
      .from("payments")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .limit(1);
    if (checkError) throw checkError;
    if (existing?.length) throw new Error("Pending payment already exists.");

    const { data, error } = await supabase
      .from("payments")
      .insert({
        tenant_id: tenantId,
        amount,
        method,
        utr_id: utrId || null,
        screenshot_url: screenshotUrl || null,
        status: "pending" as PaymentStatus
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePaymentStatus(paymentId: string, status: Extract<PaymentStatus, "approved" | "rejected">) {
    const { data, error } = await supabase
      .from("payments")
      .update({ status })
      .eq("id", paymentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
