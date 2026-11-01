"use client";

import { signOut } from "next-auth/react";
import { AUTH_EVENT, broadcastAuthEvent } from "./auth-channel";

export async function logout(redirectTo = "/login") {
  broadcastAuthEvent(AUTH_EVENT.LOGOUT);
  localStorage.clear();
  sessionStorage.clear();
  await signOut({ redirectTo });
}
