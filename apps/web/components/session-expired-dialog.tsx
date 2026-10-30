"use client";

import { IconLock } from "@tabler/icons-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSessionStore } from "@/lib/store/session-store";
import { logout } from "@/lib/auth/logout";

export function SessionExpiredDialog() {
  const open = useSessionStore((s) => s.open);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <IconLock aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Sesi telah berakhir</AlertDialogTitle>
          <AlertDialogDescription>
            Harap Masuk kembali untuk melanjutkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => logout("/login")}>
            Masuk kembali
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
