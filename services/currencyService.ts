export interface ExchangeRatesResponse {
  rates: Record<string, number>;
}

const FALLBACK_USD_TO_INR = 83;

export const currencyService = {
  async getUsdToInrRate(): Promise<number> {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error("Failed to fetch rates");
      const data = (await res.json()) as ExchangeRatesResponse;
      const inr = data?.rates?.INR;
      if (!inr || Number.isNaN(inr)) return FALLBACK_USD_TO_INR;
      return inr;
    } catch {
      return FALLBACK_USD_TO_INR;
    }
  },

  format(amountInInr: number, currency: "INR" | "USD", usdToInr: number): string {
    if (currency === "INR") return `Rs ${amountInInr.toFixed(2)}`;
    const usd = amountInInr / usdToInr;
    return `$${usd.toFixed(2)}`;
  }
};
