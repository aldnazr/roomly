"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  IconDeviceDesktop,
  IconDoorEnter,
  IconMoon,
  IconSun,
  IconUser,
  IconUserCircle,
} from "@tabler/icons-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { logout } from "@/lib/auth/logout";
import da from "zod/v4/locales/da.cjs";

export function GuestHeader() {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";
  const { data: sessionData } = useSession();
  const isGuest = sessionData?.user.role === "guest";

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
        <ModeToggle />
        <div className="flex items-center gap-2">
          {!isSignedIn ? (
            <Button
              nativeButton={false}
              render={<Link href="/login" />}
              className="h-11 px-4 sm:h-9 sm:px-3"
            >
              Masuk
            </Button>
          ) : isGuest ? (
            <GuestProfile />
          ) : (
            <Button
              nativeButton={false}
              render={<Link href="/dashboard" />}
              className="h-11 px-4 sm:h-9 sm:px-3"
            >
              Dashboard
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function GuestProfile() {
  interface typeData {
    name: string;
    shortcut: string;
    url: string;
  }

  const data: Array<typeData> = [
    { name: "Profile", shortcut: "⇧⌘P", url: "/guest/profile" },
    { name: "History", shortcut: "⇧⌘H", url: "/guest/history" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size={"icon"} variant="outline">
            <IconUser />
          </Button>
        }
      />
      <DropdownMenuContent className="w-40" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          {data.map((e) => (
            <DropdownMenuItem
              key={e.name}
              nativeButton={false}
              render={
                <Link href={e.url}>
                  {e.name}
                  <DropdownMenuShortcut>{e.shortcut}</DropdownMenuShortcut>
                </Link>
              }
            ></DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void logout("/login");
            }}
          >
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
