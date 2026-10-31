import type { ReactNode } from "react";
import { IconReceipt2, IconRefresh, type Icon } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function HistoryEmpty({
  icon: StateIcon = IconReceipt2,
  title,
  description,
  children,
}: {
  icon?: Icon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-foreground/5">
        <StateIcon className="size-5" stroke={1.5} aria-hidden="true" />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="font-heading text-base font-medium">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

export function HistoryError({
  onRetry,
  title = "Riwayat belum dapat dimuat",
  description = "Periksa koneksi server, lalu coba kembali.",
}: {
  onRetry: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-64 flex-col items-center justify-center gap-4 px-6 py-12 text-center"
    >
      <div className="flex max-w-sm flex-col gap-1">
        <p className="font-heading text-base font-medium text-destructive">
          {title}
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        <IconRefresh data-icon="inline-start" aria-hidden="true" />
        Coba lagi
      </Button>
    </div>
  );
}
