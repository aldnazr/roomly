"use client";

import { PermissionGuard } from "@/components/permission-guard";
import { RoleError } from "@/features/role/components/role-error";
import { RoleLoading } from "@/features/role/components/role-loading";
import { RoleSuccess } from "@/features/role/components/role-success";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { useRole } from "@/features/role/use-role";

export default function RolePage() {
  const { isLoading, isError, data, refetch } = useRole();
  const roles = data?.data ?? [];
  const permissionCount = roles.map((role) => role.permissions).length;

  return (
    <PermissionGuard permission="permissions.manage">
      <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-4xl bg-card p-6 shadow-sm ring-1 ring-foreground/5 sm:p-8">
          <div
            className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Kontrol akses
              </p>
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Role &amp; permission
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Atur batas akses setiap level pengguna agar operasional hotel
                tetap aman dan terstruktur.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 md:min-w-64">
              <div className="rounded-3xl bg-muted/60 p-4 ring-1 ring-foreground/5">
                <div className="text-2xl font-semibold tabular-nums">
                  {isLoading ? <Skeleton className="h-7 w-10" /> : roles.length}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Total role</p>
              </div>
              <div className="rounded-3xl bg-muted/60 p-4 ring-1 ring-foreground/5">
                <div className="text-2xl font-semibold tabular-nums">
                  {isLoading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    permissionCount
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Hak akses</p>
              </div>
            </div>
          </div>
        </section>

        {isLoading && <RoleLoading />}
        {isError && !isLoading && <RoleError onRetry={() => refetch()} />}
        {!isLoading && !isError && <RoleSuccess roles={roles} />}
      </div>
    </PermissionGuard>
  );
}
