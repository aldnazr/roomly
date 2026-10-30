// types/next-auth.d.ts

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    username?: string;
    role?: string;
    accessToken?: string;
    expiresAt?: number;
  }

  interface Session {
    user: {
      id: string;
      username?: string;
      role?: string;
      accessToken?: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: string;
    accessToken?: string;
    expiresAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: string;
    accessToken?: string;
    expiresAt?: number;
  }
}
