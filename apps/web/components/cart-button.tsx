import { useChartStore } from "@/lib/store/chart-store";
import { IconShoppingBag, IconTrash } from "@tabler/icons-react";
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
import { Button } from "./ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "./ui/item";
import { Badge } from "./ui/badge";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function CartButton() {
  const chartItems = useChartStore((s) => s.items);
  const removeItem = useChartStore((s) => s.removeItem);
  const [open, setOpen] = useState(false);
  const isEmpty = chartItems.length === 0;
  const isMobile = useIsMobile();

  const handleOpenChange = (open: boolean) => {
    if (open && isEmpty) {
      toast.error("Keranjang kosong", {
        id: "cart-empty",
        description: "Tambahkan kamar dulu sebelum membuka keranjang.",
      });
      return;
    }
    setOpen(open);
  };

  function HandleRemoveItem(e: React.MouseEvent, roomId: string) {
    e.preventDefault();
    removeItem(roomId);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        nativeButton
        aria-disabled={isEmpty}
        render={
          <Button className="relative shrink-0 size-9 md:size-11">
            <IconShoppingBag className="size-5 md:size-6" />
            <div className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-background text-foreground text-xs font-semibold shadow-md shadow-black/30 z-10">
              <span>{chartItems.length}</span>
            </div>
          </Button>
        }
      />
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="rounded-t-3xl max-h-[80vh] md:max-h-full overflow-y-auto"
      >
        {!isEmpty && (
          <SheetHeader>
            <SheetTitle>Keranjang Belanja</SheetTitle>
            <SheetDescription>
              Daftar kamar yang telah Anda pilih.
            </SheetDescription>
          </SheetHeader>
        )}
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
            <div className="rounded-full bg-muted p-4">
              <IconShoppingBag className="size-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                Keranjang Masih Kosong
              </p>
              <p className="text-sm">
                Pilih kamar pilihan Anda untuk mulai memesan.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 auto-rows-min gap-6 px-4">
            {chartItems.map((e, idx) => (
              <Item
                key={`${e.id}${idx}`}
                variant="outline"
                render={<Link href={`/guest/room/${e.id}`} />}
              >
                <ItemContent className="space-y-2">
                  <ItemTitle>{e.name}</ItemTitle>
                  <ItemDescription className="space-x-1 space-y-1">
                    {e.amenities.slice(0, 3).map((amn, idx) => (
                      <Badge key={idx}>{amn}</Badge>
                    ))}
                    {e.amenities.length > 3 && (
                      <Badge>{`+${e.amenities.length - 3} More`}</Badge>
                    )}
                  </ItemDescription>
                  <ItemDescription>
                    {formatRupiah(e.base_price)}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button onClick={(event) => HandleRemoveItem(event, e.id)}>
                    <IconTrash />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </div>
        )}
        {!isEmpty && (
          <SheetFooter>
            <div className="flex justify-between">
              <h2>Total</h2>
              <h3>
                {formatRupiah(
                  chartItems.reduce((acc, value) => acc + value.base_price, 0),
                )}
              </h3>
            </div>
            <Button type="submit">Bayar</Button>
            <SheetClose render={<Button variant="outline">Batal</Button>} />
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
