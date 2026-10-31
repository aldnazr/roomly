import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export { cn } from "cn";

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(+1);
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  value?: string | null,
  pattern = "dd MMM yyyy",
): string {
  if (!value) return "-";
  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, pattern, { locale: idLocale });
}

export function countNights(checkIn: string, checkOut: string): number {
  const nights = differenceInCalendarDays(
    parseISO(checkOut),
    parseISO(checkIn),
  );
  return Number.isNaN(nights) ? 0 : Math.max(0, nights);
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
type StatusMeta = { label: string; variant: BadgeVariant };

const RESERVATION_STATUS: Record<string, StatusMeta> = {
  pending: { label: "Menunggu", variant: "outline" },
  pending_payment: { label: "Menunggu pembayaran", variant: "outline" },
  confirmed: { label: "Terkonfirmasi", variant: "default" },
  checked_in: { label: "Sedang menginap", variant: "default" },
  checked_out: { label: "Selesai", variant: "secondary" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
};

const PAYMENT_STATUS: Record<string, StatusMeta> = {
  pending: { label: "Menunggu", variant: "outline" },
  paid: { label: "Lunas", variant: "default" },
  failed: { label: "Gagal", variant: "destructive" },
  expired: { label: "Kedaluwarsa", variant: "secondary" },
};

export function reservationStatusMeta(status: string): StatusMeta {
  return RESERVATION_STATUS[status] ?? { label: status, variant: "outline" };
}

export function paymentStatusMeta(status: string): StatusMeta {
  return PAYMENT_STATUS[status] ?? { label: status, variant: "outline" };
}
