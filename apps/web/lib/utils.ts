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
