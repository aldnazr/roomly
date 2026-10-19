"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { IconDoorEnter } from "@tabler/icons-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

export function GuestHeader() {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-background/60 px-4 backdrop-blur-sm sm:px-6">
      <Link
        href="/guest"
        className="flex h-11 items-center gap-2 rounded-md font-heading text-base font-semibold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <IconDoorEnter className="size-4" aria-hidden="true" />
        </span>
        Roomly
      </Link>

      <div className="flex items-center gap-2">
        <ModeToggle className="size-11 sm:size-9" />
        {isSignedIn ? (
          <Button
            nativeButton={false}
            render={<Link href={"/dashboard"} />}
            className="h-11 px-4 sm:h-9 sm:px-3"
          >
            Dashboard
          </Button>
        ) : (
          <Button
            nativeButton={false}
            render={<Link href={"/login"} />}
            className="h-11 px-4 sm:h-9 sm:px-3"
          >
            Masuk
          </Button>
        )}
      </div>
    </header>
  );
}
