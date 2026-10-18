"use client";

import { useAuthMe } from "@/features/auth/use-auth";
import { forbidden } from "next/navigation";

export function useHasPermission(permission: string): boolean {
  const { data: userData } = useAuthMe();
  return userData?.data?.permissions?.includes(permission) ?? false;
}

export function PermissionGuard({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { data: userData, isLoading } = useAuthMe();

  if (isLoading) return null;

  if (!userData?.data?.permissions?.includes(permission)) {
    forbidden();
  }

  return <>{children}</>;
}
