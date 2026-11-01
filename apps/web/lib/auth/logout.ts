"use client";

import { signOut } from "next-auth/react";
import { AUTH_EVENT, broadcastAuthEvent } from "./auth-channel";
import { useCartStore } from "../store/cart-store";

export async function logout(redirectTo = "/login") {
  broadcastAuthEvent(AUTH_EVENT.LOGOUT);
  useCartStore.persist.clearStorage();
  localStorage.clear();
  sessionStorage.clear();
  await signOut({ redirectTo });
}
