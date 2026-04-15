import { supabase } from "../lib/supabase";

const PAYMENT_BUCKET = "payment-screenshots";
const DOCUMENT_BUCKET = "documents";

export const documentService = {
  async uploadImage(bucket: string, path: string, fileBlob: Blob) {
    const { error } = await supabase.storage.from(bucket).upload(path, fileBlob, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  async uploadPaymentScreenshot(userId: string, paymentId: string, fileBlob: Blob) {
    const path = `${userId}/${paymentId}.jpg`;
    return this.uploadImage(PAYMENT_BUCKET, path, fileBlob);
  },

  async uploadDocument(input: { propertyId: string; tenantId?: string; userId: string; fileBlob: Blob }) {
    const path = `${input.userId}/${Date.now()}.jpg`;
    const fileUrl = await this.uploadImage(DOCUMENT_BUCKET, path, input.fileBlob);
    const { data, error } = await supabase
      .from("documents")
      .insert({
        property_id: input.propertyId,
        tenant_id: input.tenantId || null,
        file_url: fileUrl,
        extracted_data: {
          status: "pending_ocr",
          note: "OCR placeholder. Integrate external OCR API here."
        }
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listDocumentsForOwner(ownerId: string) {
    const { data, error } = await supabase
      .from("documents")
      .select("*, properties!inner(*)")
      .eq("properties.owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }
};
