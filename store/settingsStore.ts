import { create } from "zustand";

type Currency = "INR" | "USD";

interface SettingsState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: "INR",
  setCurrency: (currency) => set({ currency })
}));
