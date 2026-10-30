import { Item } from "@/components/ui/item";
import { Room } from "@/features/room/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type chartState = {
  items: Array<Room>;
  addItem: (room: Room) => void;
  removeItem: (roomId: string) => void;
  reset: () => void;
};

export const useCartStore = create<chartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (roomId) =>
        set((state) => ({
          items: [...state.items].filter((room) => room.id !== roomId),
        })),
      reset: () =>
        set((s) => ({
          items: [],
        })),
    }),
    { name: "chart-storage" },
  ),
);
