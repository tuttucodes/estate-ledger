import { useQuery } from "@tanstack/react-query";
import { currencyService } from "../services/currencyService";
import { useSettingsStore } from "../store/settingsStore";

export function useCurrency() {
  const currency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);

  const rateQuery = useQuery({
    queryKey: ["usd-inr-rate"],
    queryFn: currencyService.getUsdToInrRate,
    staleTime: 1000 * 60 * 30
  });

  const usdToInr = rateQuery.data ?? 83;
  const formatAmount = (amountInInr: number) => currencyService.format(amountInInr, currency, usdToInr);

  return { currency, setCurrency, usdToInr, formatAmount, rateQuery };
}
