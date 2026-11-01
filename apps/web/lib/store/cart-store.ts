import { Item } from "@/components/ui/item";
import { Room } from "@/features/room/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ChartState = {
  items: Room | null;
  addItem: (room: Room) => void;
  reset: () => void;
};

export const useCartStore = create<ChartState>()(
  persist(
    (set) => ({
      items: null,
      addItem: (item) => set({ items: item }),
      reset: () => set({ items: null }),
    }),
    {
      name: "chart-storage",
      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);
