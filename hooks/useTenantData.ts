import { useQuery } from "@tanstack/react-query";
import { paymentService } from "../services/paymentService";
import { tenantService } from "../services/tenantService";

export function useTenantData(userId?: string) {
  const tenantQuery = useQuery({
    queryKey: ["tenant-by-user", userId],
    queryFn: () => tenantService.getTenantByUserId(userId as string),
    enabled: Boolean(userId)
  });

  const agreementQuery = useQuery({
    queryKey: ["tenant-agreement", tenantQuery.data?.id],
    queryFn: () => tenantService.getRentAgreement(tenantQuery.data.id),
    enabled: Boolean(tenantQuery.data?.id)
  });

  const paymentsQuery = useQuery({
    queryKey: ["tenant-payments", tenantQuery.data?.id],
    queryFn: () => paymentService.listPaymentsByTenant(tenantQuery.data.id),
    enabled: Boolean(tenantQuery.data?.id)
  });

  return { tenantQuery, agreementQuery, paymentsQuery };
}
