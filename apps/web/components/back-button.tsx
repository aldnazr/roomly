"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

export function BackButton({ href, text }: { href?: string; text: string }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      nativeButton={!href}
      onClick={href ? undefined : () => router.back()}
      render={href ? <Link href={href} /> : undefined}
      className="-ml-2 h-11 min-w-11 gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/8 hover:text-primary active:scale-[0.98] sm:h-10"
    >
      <IconArrowLeft
        data-icon="inline-start"
        aria-hidden="true"
        className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/button:-translate-x-0.5"
      />
      <span>{text}</span>
    </Button>
  );
}
