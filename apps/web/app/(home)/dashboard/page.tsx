"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  IconArrowRight,
  IconBed,
  IconCalendar,
  IconDoor,
  IconUserCheck,
  IconUserX,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InsetCard } from "@/components/ui/inset-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCheckInReservation,
  useCheckOutReservation,
  useDailyOperations,
} from "@/features/reservations/use-reservation";
import { formatDate, formatRupiah, reservationStatusMeta } from "@/lib/utils";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"checkin" | "checkout">("checkin");
  const { data, isLoading, isError, refetch } = useDailyOperations();
  const checkInMutation = useCheckInReservation();
  const checkOutMutation = useCheckOutReservation();

  const operations = data?.data;
  const stats = operations?.stats;
  const checkIns = operations?.check_ins ?? [];
  const checkOuts = operations?.check_outs ?? [];

  const greetingName = session?.user?.name || "Staf";

  const handleCheckIn = async (id: string) => {
    try {
      await checkInMutation.mutateAsync(id);
      toast.success("Check-in berhasil diproses");
    } catch {
      toast.error("Gagal memproses check-in");
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await checkOutMutation.mutateAsync(id);
      toast.success("Check-out berhasil diproses");
    } catch {
      toast.error("Gagal memproses check-out");
    }
  };

  return (
    <div className="space-y-8">
      <InsetCard as="section">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Front Desk Console
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Selamat bertugas, {greetingName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Pantau kedatangan dan keberangkatan tamu hari ini, serta status
              kamar operasional.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
            <IconCalendar
              className="size-4"
              stroke={1.5}
              aria-hidden="true"
            />
            <span>
              {formatDate(
                operations?.date ?? new Date().toISOString().slice(0, 10),
                "EEEE, dd MMMM yyyy",
              )}
            </span>
          </div>
        </div>
      </InsetCard>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-[2rem]" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <InsetCard innerClassName="p-6 text-center">
          <p className="font-medium text-destructive">
            Gagal memuat data operasional
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Periksa koneksi server, lalu coba lagi.
          </p>
          <Button
            className="mt-4 rounded-full"
            variant="outline"
            onClick={() => refetch()}
          >
            Coba lagi
          </Button>
        </InsetCard>
      )}

      {!isLoading && !isError && stats && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Check-in hari ini",
              value: stats.total_check_ins,
              icon: IconUserCheck,
              hint: "Kedatangan diharapkan",
            },
            {
              label: "Check-out hari ini",
              value: stats.total_check_outs,
              icon: IconUserX,
              hint: "Keberangkatan diharapkan",
            },
            {
              label: "Kamar terisi",
              value: stats.occupied_rooms,
              icon: IconBed,
              hint: "Unit sedang ditempati",
            },
            {
              label: "Kamar siap",
              value: stats.available_rooms,
              icon: IconDoor,
              hint: "Unit tersedia",
            },
          ].map((card) => (
            <InsetCard
              key={card.label}
              className="p-1.5 sm:p-1.5"
              innerClassName="rounded-[calc(2rem-6px)] p-5 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </p>
                <card.icon
                  className="size-4 text-muted-foreground"
                  stroke={1.5}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-3 font-heading text-3xl font-semibold tracking-tight tabular-nums">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.hint}
              </p>
            </InsetCard>
          ))}
        </section>
      )}

      {!isLoading && !isError && (
        <InsetCard as="section" innerClassName="p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("checkin")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  activeTab === "checkin"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Check-in hari ini
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("checkout")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  activeTab === "checkout"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Check-out hari ini
              </button>
            </div>

            {activeTab === "checkin" && (
              <div className="space-y-4">
                {checkIns.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="font-medium">Tidak ada kedatangan hari ini</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Daftar tamu dengan check-in hari ini akan tampil di sini.
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {checkIns.map((item) => {
                      const status = reservationStatusMeta(item.status);
                      return (
                        <li
                          key={item.id}
                          className="rounded-[1.5rem] bg-muted/40 p-1.5 ring-1 ring-foreground/5"
                        >
                          <div className="flex flex-col gap-4 rounded-[calc(1.5rem-6px)] bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium">
                                  {item.guest_name}
                                </p>
                                <Badge variant={status.variant}>
                                  {status.label}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {item.room_type_name}{" "}
                                {item.room_number
                                  ? `· Kamar ${item.room_number}`
                                  : ""}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatDate(item.check_in)} sampai{" "}
                                {formatDate(item.check_out)} ·{" "}
                                {formatRupiah(item.total_price)}
                              </p>
                            </div>
                            <Button
                              className="group/cta rounded-full pr-1.5 pl-5"
                              onClick={() => handleCheckIn(item.id)}
                              disabled={checkInMutation.isPending}
                            >
                              Proses check-in
                              <span className="ml-2 flex size-8 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-0.5">
                                <IconArrowRight
                                  className="size-4"
                                  stroke={1.5}
                                />
                              </span>
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {activeTab === "checkout" && (
              <div className="space-y-4">
                {checkOuts.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="font-medium">
                      Tidak ada keberangkatan hari ini
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Daftar tamu dengan check-out hari ini akan tampil di sini.
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {checkOuts.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-[1.5rem] bg-muted/40 p-1.5 ring-1 ring-foreground/5"
                      >
                        <div className="flex flex-col gap-4 rounded-[calc(1.5rem-6px)] bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {item.guest_name}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.room_type_name}{" "}
                              {item.room_number
                                ? `· Kamar ${item.room_number}`
                                : ""}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(item.check_in)} sampai{" "}
                              {formatDate(item.check_out)} ·{" "}
                              {formatRupiah(item.total_price)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => handleCheckOut(item.id)}
                            disabled={checkOutMutation.isPending}
                          >
                            Proses check-out
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
        </InsetCard>
      )}
    </div>
  );
}
