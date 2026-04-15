import { useQuery } from "@tanstack/react-query";
import { expenseService } from "../services/expenseService";
import { paymentService } from "../services/paymentService";
import { propertyService } from "../services/propertyService";

export function useOwnerDashboard(ownerId?: string) {
  const enabled = Boolean(ownerId);

  const propertiesQuery = useQuery({
    queryKey: ["owner-properties", ownerId],
    queryFn: () => propertyService.listOwnerProperties(ownerId as string),
    enabled
  });

  const paymentsQuery = useQuery({
    queryKey: ["owner-payments", ownerId],
    queryFn: () => paymentService.listAllPaymentsForOwner(ownerId as string),
    enabled
  });

  const expensesQuery = useQuery({
    queryKey: ["owner-expenses", ownerId],
    queryFn: () => expenseService.listOwnerExpenses(ownerId as string),
    enabled
  });

  return { propertiesQuery, paymentsQuery, expensesQuery };
}
