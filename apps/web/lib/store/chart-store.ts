import { Item } from "@/components/ui/item";
import { Room } from "@/features/room/types";
import { create } from "zustand";

type chartState = {
  items: Array<Room>;
  addItem: (room: Room) => void;
  removeItem: (roomId: string) => void;
};

export const useChartStore = create<chartState>()((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (roomId) =>
    set((state) => ({
      items: [...state.items].filter((room) => room.id !== roomId),
    })),
}));
