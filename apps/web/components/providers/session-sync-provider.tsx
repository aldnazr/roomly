"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

import { AUTH_EVENT, subscribeAuthEvents } from "@/lib/auth/auth-channel";

export function SessionSyncProvider() {
  useEffect(() => {
    return subscribeAuthEvents(async (event) => {
      if (event !== AUTH_EVENT.LOGOUT) {
        return;
      }

      await signOut({ redirect: false }).catch(() => undefined);
      window.location.replace("/login");
    });
  }, []);

  return null;
}
