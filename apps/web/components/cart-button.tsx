"use client";

import Link from "next/link";
import {
  IconArrowRight,
  IconShoppingBag,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useState } from "react";
import { useChartStore } from "@/lib/store/chart-store";
import { formatRupiah } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "./ui/item";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export function CartButton() {
  const items = useChartStore((state) => state.items);
  const removeItem = useChartStore((state) => state.removeItem);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const isEmpty = items.length === 0;
  const total = items.reduce((sum, room) => sum + room.base_price, 0);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && isEmpty) {
      toast.error("Keranjang kosong", {
        id: "cart-empty",
        description: "Tambahkan kamar dulu sebelum membuka keranjang.",
      });
      return;
    }
    setOpen(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        nativeButton
        aria-disabled={isEmpty}
        render={
          <Button className="relative size-11 shrink-0 rounded-full">
            <IconShoppingBag className="size-5" stroke={1.6} />
            <span className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-background text-xs font-semibold text-foreground shadow-[0_4px_14px_rgb(25_20_15/0.16)] ring-1 ring-foreground/8">
              {items.length}
            </span>
          </Button>
        }
      />
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="max-h-[85dvh] overflow-y-auto rounded-t-[2rem] sm:max-h-full sm:rounded-none"
      >
        <SheetHeader>
          <SheetTitle>Keranjang Anda</SheetTitle>
          <SheetDescription>
            Kamar yang siap dilanjutkan ke checkout.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-3 px-6">
          {items.map((room, index) => (
            <Item key={`${room.id}-${index}`} variant="outline">
              <ItemContent className="space-y-2">
                <ItemTitle>{room.name}</ItemTitle>
                <ItemDescription className="space-x-1 space-y-1">
                  {room.amenities.slice(0, 3).map((amenity) => (
                    <Badge key={amenity}>{amenity}</Badge>
                  ))}
                </ItemDescription>
                <ItemDescription>
                  {formatRupiah(room.base_price)} / malam
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Hapus ${room.name} dari keranjang`}
                  onClick={() => removeItem(room.id)}
                >
                  <IconTrash className="size-4" stroke={1.6} />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </div>
        <SheetFooter>
          <div className="flex items-center justify-between px-1 text-sm">
            <span className="text-muted-foreground">Harga dasar</span>
            <span className="font-semibold text-foreground">
              {formatRupiah(total)}
            </span>
          </div>
          <SheetClose
            nativeButton={false}
            render={
              <Button
                nativeButton={false}
                render={<Link href="/guest/checkout" />}
                className="h-11 w-full rounded-full px-5 sm:h-10"
              />
            }
          >
            Checkout
            <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/button:translate-x-0.5">
              <IconArrowRight className="size-3.5" stroke={1.6} />
            </span>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
