export type UserRole = "owner" | "tenant";
export type PaymentMethod = "upi" | "bank" | "cash";
export type PaymentStatus = "pending" | "approved" | "rejected";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  upi_id?: string | null;
}

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  location: string;
}

export interface Unit {
  id: string;
  property_id: string;
  name: string;
}

export interface Tenant {
  id: string;
  user_id: string;
  unit_id: string;
}

export interface RentAgreement {
  id: string;
  tenant_id: string;
  rent_amount: number;
  due_date: number;
  start_date: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  method: PaymentMethod;
  utr_id: string | null;
  screenshot_url: string | null;
  status: PaymentStatus;
  created_at: string;
}

export interface Expense {
  id: string;
  property_id: string;
  category: string;
  amount: number;
  notes: string | null;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  property_id: string;
  tenant_id: string | null;
  file_url: string;
  extracted_data: Record<string, unknown>;
  created_at: string;
}
