import { create } from "zustand";

interface AppState {
  selectedPropertyId: string | null;
  setSelectedPropertyId: (propertyId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedPropertyId: null,
  setSelectedPropertyId: (propertyId) => set({ selectedPropertyId: propertyId })
}));
