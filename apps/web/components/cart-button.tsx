import { IconShoppingBag } from "@tabler/icons-react";

export function CartButton() {
  return (
    <div className="relative flex hover:cursor-pointer rounded-full size-11 bg-primary text-primary-foreground text-center items-center justify-center">
      <IconShoppingBag className="size-6" />
      <div className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background text-foreground text-xs font-semibold shadow-md shadow-black/30 z-10">
        <span>1</span>
      </div>
    </div>
  );
}
