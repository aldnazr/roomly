"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { DateRange } from "react-day-picker";
import { format, differenceInDays } from "date-fns";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCreditCard,
  IconShieldCheck,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart-store";
import { formatRupiah } from "@/lib/utils";
import { useCreateCheckout } from "@/features/reservations/use-reservation";
import type { BankCode, PaymentMethod } from "@/features/payments/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CheckoutFormValues = {
  stay?: DateRange;
  method: PaymentMethod;
  bank: BankCode;
};

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const resetItem = useCartStore((state) => state.reset);
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    defaultValues: { method: "va", bank: "bca" },
  });
  const method = useWatch({ control, name: "method" });
  const stay = useWatch({ control, name: "stay" });
  const selectedRoom = items[0];
  const hasMultipleRooms = items.length > 1;
  const subtotal = useMemo(
    () => items.reduce((sum, room) => sum + room.base_price, 0),
    [items],
  );
  const nights =
    stay?.from && stay?.to ? differenceInDays(stay.to, stay.from) : 0;
  const total = useMemo(() => subtotal * (nights > 0 ? nights : 0), [nights]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const createCheckoutMutation = useCreateCheckout();

  const submitCheckout = (values: CheckoutFormValues) => {
    if (!selectedRoom) return;
    if (hasMultipleRooms) {
      setError("stay", {
        type: "validate",
        message: "Checkout saat ini menerima satu tipe kamar per pembayaran.",
      });
      return;
    }
    if (!values.stay?.from || !values.stay.to) {
      setError("stay", {
        type: "required",
        message: "Pilih tanggal check-in dan check-out.",
      });
      return;
    }

    createCheckoutMutation.mutate(
      {
        roomTypeId: selectedRoom.id,
        stay: { from: values.stay.from, to: values.stay.to },
        method: values.method,
        bank: values.bank,
      },
      {
        onSuccess: (payment) => {
          router.push(`/guest/pay/${payment.data.id}`);
          resetItem();
        },
        onError: (error) => {
          toast.error("Pembayaran belum dapat dibuat", {
            description:
              error instanceof Error
                ? error.message
                : "Pesanan tidak dapat dibuat.",
          });
        },
      },
    );
  };

  if (!selectedRoom) {
    return (
      <section className="mx-auto flex min-h-[56dvh] max-w-lg flex-col items-center justify-center text-center">
        <div className="rounded-[2rem] bg-muted/70 p-2 ring-1 ring-foreground/5">
          <div className="rounded-[1.5rem] bg-card px-8 py-10 shadow-[inset_0_1px_1px_rgb(255_255_255/0.2)]">
            <p className="text-lg font-semibold">
              Belum ada kamar untuk di-checkout
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Pilih kamar dari katalog untuk melanjutkan pemesanan.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/guest" />}
              className="mt-6 h-11 rounded-full px-5"
            >
              Lihat katalog
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-4 sm:py-8">
      <Button
        nativeButton={false}
        render={<Link href="/guest" />}
        variant="ghost"
        className="mb-7 h-11 px-2 sm:h-9"
      >
        <IconArrowLeft className="size-4" stroke={1.6} /> Kembali ke katalog
      </Button>

      <div className="mb-8 max-w-xl">
        <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
          Checkout
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Selesaikan detail perjalanan Anda.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Pilih jadwal menginap dan metode pembayaran sebelum kami menyiapkan
          instruksi pembayaran.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
        <form
          onSubmit={handleSubmit(submitCheckout)}
          className="rounded-[2rem] bg-muted/60 p-1.5 ring-1 ring-foreground/5"
        >
          <div className="rounded-[1.625rem] bg-card p-5 shadow-[inset_0_1px_1px_rgb(255_255_255/0.16)] sm:p-7">
            <div className="mb-7">
              <h2 className="text-lg font-semibold tracking-tight">
                Detail pembayaran
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Semua field diperlukan untuk membuat reservasi.
              </p>
            </div>

            <div className="space-y-6">
              <Controller
                control={control}
                name="stay"
                render={({ field }) => (
                  <Field data-invalid={!!errors.stay}>
                    <FieldLabel htmlFor="stay-range">
                      <IconCalendar className="size-4" stroke={1.6} /> Tanggal
                      menginap
                    </FieldLabel>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            id="stay-range"
                            variant="outline"
                            className="h-12 w-full justify-start rounded-2xl px-4 font-normal sm:h-11"
                            aria-invalid={!!errors.stay}
                          >
                            <IconCalendar
                              data-icon="inline-start"
                              className="size-4"
                              stroke={1.6}
                            />
                            {field.value?.from ? (
                              field.value.to ? (
                                `${format(field.value.from, "dd MMM y")} sampai ${format(field.value.to, "dd MMM y")}`
                              ) : (
                                format(field.value.from, "dd MMM y")
                              )
                            ) : (
                              <span>Pilih tanggal menginap</span>
                            )}
                          </Button>
                        }
                      />
                      <PopoverContent
                        className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="range"
                          defaultMonth={field.value?.from}
                          selected={field.value}
                          onSelect={field.onChange}
                          numberOfMonths={2}
                          disabled={{ before: today }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FieldError errors={[errors.stay]} />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="payment-method">
                      <IconCreditCard className="size-4" stroke={1.6} /> Metode
                      pembayaran
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? "va")}
                      items={[
                        { label: "Virtual Account", value: "va" },
                        { label: "QRIS", value: "qris" },
                      ]}
                    >
                      <SelectTrigger
                        id="payment-method"
                        className="h-12 w-full rounded-2xl px-4 sm:h-11"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Pilih metode</SelectLabel>
                          <SelectItem value="va">Virtual Account</SelectItem>
                          <SelectItem value="qris">QRIS</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              {method === "va" && (
                <Controller
                  control={control}
                  name="bank"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="payment-bank">
                        Bank tujuan
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) =>
                          field.onChange(value ?? "bca")
                        }
                        items={[
                          { label: "BCA", value: "bca" },
                          { label: "BNI", value: "bni" },
                          { label: "BRI", value: "bri" },
                          { label: "Mandiri", value: "mandiri" },
                        ]}
                      >
                        <SelectTrigger
                          id="payment-bank"
                          className="h-12 w-full rounded-2xl px-4 sm:h-11"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Pilih bank</SelectLabel>
                            <SelectItem value="bca">BCA</SelectItem>
                            <SelectItem value="bni">BNI</SelectItem>
                            <SelectItem value="bri">BRI</SelectItem>
                            <SelectItem value="mandiri">Mandiri</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              )}
            </div>

            {hasMultipleRooms && (
              <p className="mt-6 text-sm leading-6 text-destructive">
                Checkout saat ini menerima satu tipe kamar per pembayaran. Hapus
                kamar lain dari ringkasan pesanan.
              </p>
            )}

            <Button
              type="submit"
              disabled={createCheckoutMutation.isPending || hasMultipleRooms}
              className="mt-8 h-12 w-full rounded-full px-5 sm:h-11"
            >
              {createCheckoutMutation.isPending
                ? "Membuat pembayaran..."
                : "Lanjut ke pembayaran"}
              <span className="flex size-7 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/button:translate-x-0.5">
                <IconArrowRight className="size-4" stroke={1.6} />
              </span>
            </Button>
            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <IconShieldCheck
                className="mt-0.5 size-4 shrink-0"
                stroke={1.6}
              />
              Harga final mengikuti tanggal menginap yang dipilih.
            </div>
          </div>
        </form>

        <aside className="rounded-[2rem] bg-foreground/4.5 p-1.5 ring-1 ring-foreground/5 lg:sticky lg:top-20">
          <div className="rounded-[1.625rem] bg-card p-5 shadow-[inset_0_1px_1px_rgb(255_255_255/0.16)] sm:p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Ringkasan pesanan
              </h2>
              <span className="text-xs text-muted-foreground">
                {items.length} kamar
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {items.map((room, index) => (
                <div
                  key={`${room.id}-${index}`}
                  className="flex gap-3 border-b border-border/60 pb-4 last:border-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{room.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {room.amenities.slice(0, 3).map((amenity) => (
                        <Badge key={amenity}>{amenity}</Badge>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {formatRupiah(room.base_price)} / malam
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    type="button"
                    aria-label={`Hapus ${room.name} dari keranjang`}
                    onClick={() => removeItem(room.id)}
                  >
                    <IconTrash className="size-4" stroke={1.6} />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-5">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-lg font-semibold tracking-tight">
                {formatRupiah(subtotal)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold tracking-tight">
                {formatRupiah(total)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
