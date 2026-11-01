"use client";

import { PermissionGuard } from "@/components/permission-guard";
import { HeroSection } from "@/components/hero-section";
import { RoleError } from "@/features/role/components/role-error";
import { RoleLoading } from "@/features/role/components/role-loading";
import { RoleSuccess } from "@/features/role/components/role-success";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole } from "@/features/role/use-role";

export default function RolePage() {
  const { isLoading, isError, data, refetch } = useRole();
  const roles = data?.data ?? [];
  const permissionCount = roles.map((role) => role.permissions).length;

  return (
    <PermissionGuard permission="permissions.manage">
      <div className="flex flex-col gap-6">
        <HeroSection
          eyebrow="Kontrol akses"
          title="Role & permission"
          description="Atur batas akses setiap level pengguna agar operasional hotel tetap aman dan terstruktur."
          rightChildren={
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
          }
        />

        {isLoading && <RoleLoading />}
        {isError && !isLoading && <RoleError onRetry={() => refetch()} />}
        {!isLoading && !isError && <RoleSuccess roles={roles} />}
      </div>
    </PermissionGuard>
  );
}
