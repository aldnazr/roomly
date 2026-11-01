"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthMe } from "@/features/auth/use-auth";
import { capitalize, cn } from "@/lib/utils";
import {
  IconAt,
  IconCheck,
  IconChecklist,
  IconCopy,
  IconKey,
  IconMail,
  IconRefresh,
  IconUser,
  type Icon,
} from "@tabler/icons-react";
import { useEffect, useState, type ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Primitives                                                                */
/* -------------------------------------------------------------------------- */

// Satu kurva spring untuk semua transisi, supaya geraknya konsisten.
const SPRING = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const formatPermission = (permission: string) =>
  permission.replace(/[._]/g, " ").split(" ").map(capitalize).join(" ");

/** Fade-up berurutan saat halaman muncul. Mati otomatis di reduced-motion. */
function Reveal({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-8 motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)] motion-safe:fill-mode-[both]",
        className,
      )}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      {children}
    </div>
  );
}

/** Double-bezel: cangkang luar + inti dalam dengan radius konsentris. */
function Bezel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="h-full rounded-[2rem] bg-muted/40 p-1.5 shadow-[0_32px_64px_-32px_rgb(0_0_0/0.14)] ring-1 ring-foreground/5">
      <div
        className={cn(
          "relative h-full overflow-hidden rounded-[1.625rem] bg-card shadow-[inset_0_1px_1px_rgb(255_255_255/0.16)]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function IconBadge({ icon: Icon }: { icon: Icon }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10">
      <Icon className="size-4.5" stroke={1.25} aria-hidden="true" />
    </span>
  );
}

function CardHeading({
  id,
  icon,
  title,
  description,
}: {
  id: string;
  icon: Icon;
  title: string;
  description: string;
}) {
  return (
    <header className="flex items-start gap-3.5">
      <IconBadge icon={icon} />
      <div className="min-w-0 space-y-1">
        <h2
          id={id}
          className="font-heading text-base font-semibold tracking-tight"
        >
          {title}
        </h2>
        <p className="text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // clipboard bisa ditolak (mis. konteks non-HTTPS); abaikan saja.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Salin ID akun"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground transition-[transform,color,background-color] duration-700 outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.94]",
        SPRING,
      )}
    >
      <IconCopy
        className={cn(
          "absolute size-4 transition-[transform,opacity] duration-500",
          SPRING,
          copied ? "scale-50 opacity-0" : "scale-100 opacity-100",
        )}
        stroke={1.5}
        aria-hidden="true"
      />
      <IconCheck
        className={cn(
          "absolute size-4 text-primary transition-[transform,opacity] duration-500",
          SPRING,
          copied ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
        stroke={1.75}
        aria-hidden="true"
      />
      <span className="sr-only" role="status">
        {copied ? "ID akun tersalin" : ""}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Detail row                                                                */
/* -------------------------------------------------------------------------- */

type DetailRowProps = {
  icon: Icon;
  label: string;
  value: string | number | undefined;
  mono?: boolean;
  breakAll?: boolean;
};

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
  breakAll = false,
}: DetailRowProps) {
  const empty = value === undefined || value === "";

  return (
    <div
      className={cn(
        "group relative -mx-3 flex items-center gap-4 rounded-2xl px-3 py-4 transition-colors duration-500 hover:bg-muted/40",
        SPRING,
        "after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-linear-to-r after:from-transparent after:via-border after:to-transparent last:after:hidden",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/70 text-muted-foreground transition-[transform,color] duration-700 group-hover:text-primary",
          SPRING,
        )}
      >
        <Icon className="size-4.5" stroke={1.25} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <dt className="mb-0.5 text-xs font-medium text-muted-foreground">
          {label}
        </dt>
        <dd
          className={cn(
            "min-w-0 text-sm font-medium text-foreground",
            mono && "font-mono text-[13px]",
            breakAll ? "break-all" : "wrap-break-word",
            empty && "font-normal text-muted-foreground",
          )}
        >
          {empty ? "Belum tersedia" : value}
        </dd>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading & message states                                                  */
/* -------------------------------------------------------------------------- */

const skeleton = "motion-reduce:animate-none";

function ProfileLoading() {
  return (
    <div
      className="space-y-8 sm:space-y-10"
      role="status"
      aria-label="Memuat profil"
    >
      <div className="space-y-4">
        <Skeleton className={cn("h-6 w-28 rounded-full", skeleton)} />
        <Skeleton className={cn("h-9 w-40", skeleton)} />
        <Skeleton className={cn("h-4 w-72 max-w-full", skeleton)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <Skeleton
          className={cn("h-64 rounded-[2rem] lg:col-span-8", skeleton)}
        />
        <Skeleton
          className={cn("h-64 rounded-[2rem] lg:col-span-4", skeleton)}
        />
        <Skeleton
          className={cn("h-72 rounded-[2rem] lg:col-span-5", skeleton)}
        />
        <Skeleton
          className={cn("h-72 rounded-[2rem] lg:col-span-7", skeleton)}
        />
      </div>
      <span className="sr-only">Sedang mengambil informasi akun.</span>
    </div>
  );
}

function ProfileMessage({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <section
      className="max-w-2xl"
      role={onRetry ? "alert" : "status"}
      aria-live="polite"
    >
      <Bezel>
        <div className="relative flex flex-col items-start gap-5 p-6 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_0%_0%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_70%)]"
          />
          <span className="relative flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-foreground/5">
            <IconUser className="size-5" stroke={1.25} aria-hidden="true" />
          </span>
          <div className="relative space-y-1.5">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {title}
            </h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              className={cn(
                "group relative mt-1 h-11 gap-3 rounded-full pr-1.5 pl-5 transition-transform duration-700 active:scale-[0.98]",
                SPRING,
              )}
            >
              Muat ulang profil
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full bg-foreground/5 transition-transform duration-700 group-hover:scale-105",
                  SPRING,
                )}
              >
                <IconRefresh
                  className={cn(
                    "size-4 transition-transform duration-700 group-hover:rotate-180",
                    SPRING,
                  )}
                  stroke={1.5}
                  aria-hidden="true"
                />
              </span>
            </Button>
          )}
        </div>
      </Bezel>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  View                                                                      */
/* -------------------------------------------------------------------------- */

export function ProfileView() {
  const { data, isLoading, isError, refetch } = useAuthMe();
  const profile = data?.data;
  const permissions = profile?.permissions ?? [];
  const initial = profile?.name?.trim().charAt(0).toUpperCase() || "?";

  if (isLoading) return <ProfileLoading />;

  if (isError) {
    return (
      <ProfileMessage
        title="Profil tidak dapat dimuat"
        description="Periksa koneksi internet atau server, lalu coba ambil data profil kembali."
        onRetry={() => void refetch()}
      />
    );
  }

  if (!profile) {
    return (
      <ProfileMessage
        title="Data profil belum tersedia"
        description="Belum ada informasi akun yang dapat ditampilkan untuk sesi ini."
      />
    );
  }

  const isGuest = profile.role.slug === "guest";
  const accountId = String(profile.id);

  const accountFields: DetailRowProps[] = [
    { icon: IconUser, label: "Nama lengkap", value: profile.name },
    { icon: IconMail, label: "Email", value: profile.email, breakAll: true },
    ...(!isGuest
      ? [
          {
            icon: IconAt,
            label: "Username",
            value: profile.username,
            mono: true,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header */}
      <Reveal index={0}>
        <header className="space-y-4">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Profil
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Informasi akun dan hak akses yang terhubung ke akun Anda.
            </p>
          </div>
        </header>
      </Reveal>

      {/* Bento */}
      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        {/* Identitas */}
        <Reveal
          index={1}
          className={isGuest ? "lg:col-span-12" : "lg:col-span-8"}
        >
          <Bezel>
            <div className="relative flex h-full flex-col justify-between gap-10 p-6 sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_90%_at_0%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_70%)]"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -bottom-10 hidden font-heading text-[15rem] leading-none font-semibold text-foreground/3 select-none sm:block"
              >
                {initial}
              </span>

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-7">
                <div className="shrink-0 self-start rounded-full bg-primary/5 p-1.5 ring-1 ring-primary/15 sm:self-auto">
                  <Avatar className="size-20 border-0 bg-primary/10 sm:size-24">
                    <AvatarFallback className="bg-primary/10 font-heading text-3xl font-semibold text-primary">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <h2 className="font-heading text-3xl font-semibold tracking-tight wrap-break-word sm:text-4xl">
                    {profile.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary ring-1 ring-primary/10">
                      <span
                        className="size-1.5 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      {profile.role.name}
                    </span>
                    {!isGuest && (
                      <span className="font-mono text-xs break-all text-muted-foreground">
                        @{profile.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="inline-flex max-w-full items-center gap-3 rounded-full bg-muted/60 py-1.5 pr-1.5 pl-4 ring-1 ring-foreground/5">
                  <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                    ID
                  </span>
                  <code className="min-w-0 truncate font-mono text-xs text-foreground/80">
                    {accountId}
                  </code>
                  <CopyButton value={accountId} />
                </div>
              </div>
            </div>
          </Bezel>
        </Reveal>

        {/* Ringkasan hak akses */}
        {!isGuest && (
          <Reveal index={2} className="lg:col-span-4">
            <section aria-labelledby="access-heading" className="h-full">
              <Bezel>
                <div className="flex h-full flex-col p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <h2
                      id="access-heading"
                      className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase"
                    >
                      Hak akses
                    </h2>
                    <IconBadge icon={IconKey} />
                  </div>

                  <div className="mt-8">
                    <p className="font-heading text-6xl leading-none font-semibold tracking-tight tabular-nums">
                      {permissions.length}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      permission aktif
                    </p>
                  </div>

                  <div className="mt-auto space-y-4 pt-8">
                    <div
                      aria-hidden="true"
                      className="h-px bg-linear-to-r from-transparent via-border to-transparent"
                    />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Role
                      </p>
                      <p className="text-base font-semibold">
                        {profile.role.name}
                      </p>
                      {profile.role.description && (
                        <p className="text-sm leading-5 text-muted-foreground">
                          {profile.role.description}
                        </p>
                      )}
                    </div>
                    <code className="inline-flex max-w-full rounded-full bg-muted px-3 py-1.5 font-mono text-xs break-all text-muted-foreground ring-1 ring-foreground/5">
                      {profile.role.slug}
                    </code>
                  </div>
                </div>
              </Bezel>
            </section>
          </Reveal>
        )}

        {/* Detail akun */}
        <Reveal
          index={3}
          className={isGuest ? "lg:col-span-12" : "lg:col-span-5"}
        >
          <section aria-labelledby="account-details-heading" className="h-full">
            <Bezel>
              <div className="flex h-full flex-col p-6 sm:p-8">
                <CardHeading
                  id="account-details-heading"
                  icon={IconUser}
                  title="Detail akun"
                  description="Identitas yang tersimpan pada akun Roomly."
                />
                <dl className="mt-6">
                  {accountFields.map((field) => (
                    <DetailRow key={field.label} {...field} />
                  ))}
                </dl>
              </div>
            </Bezel>
          </section>
        </Reveal>

        {/* Daftar permission */}
        {!isGuest && (
          <Reveal index={4} className="lg:col-span-7">
            <section aria-labelledby="permission-heading" className="h-full">
              <Bezel>
                <div className="flex h-full flex-col p-6 sm:p-8">
                  <CardHeading
                    id="permission-heading"
                    icon={IconChecklist}
                    title="Daftar permission"
                    description={
                      permissions.length > 0
                        ? "Akses yang diberikan oleh role ini."
                        : "Role ini belum memiliki permission."
                    }
                  />

                  {permissions.length > 0 && (
                    <ul
                      className="mt-6 flex flex-wrap gap-2"
                      aria-label="Daftar permission"
                    >
                      {permissions.map((permission) => (
                        <li
                          key={permission}
                          className={cn(
                            "group inline-flex max-w-full items-center gap-2 rounded-full bg-muted/60 py-1.5 pr-3.5 pl-2.5 text-xs font-medium text-foreground/80 ring-1 ring-foreground/5 transition-[transform,background-color,color] duration-500 hover:bg-primary/10 hover:text-primary",
                            SPRING,
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full bg-primary/40 transition-colors duration-500 group-hover:bg-primary",
                              SPRING,
                            )}
                            aria-hidden="true"
                          />
                          <span className="wrap-anywhere">
                            {formatPermission(permission)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Bezel>
            </section>
          </Reveal>
        )}
      </div>
    </div>
  );
}

export default ProfileView;
