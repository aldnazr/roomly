import * as React from "react";
import { cn } from "@/lib/utils";

interface HeroSectionProps extends Omit<
  React.ComponentProps<"section">,
  "title"
> {
  glowClassName?: string;
  gridClassName?: string;
  leftChildren?: React.ReactNode;
  rightChildren?: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
}

export function HeroSection({
  className,
  glowClassName,
  gridClassName,
  leftChildren,
  rightChildren,
  eyebrow,
  title,
  description,
  children,
  ...props
}: HeroSectionProps) {
  const right = rightChildren ?? children;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-4xl bg-card p-6 shadow-sm ring-1 ring-foreground/5 sm:p-8",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "pointer-events-none absolute size-72 rounded-full bg-primary/10 blur-3xl",
          glowClassName ?? "-right-20 -top-24",
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end",
          gridClassName,
        )}
      >
        <div className="max-w-2xl">
          {leftChildren ?? (
            <>
              {eyebrow && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {description}
                </p>
              )}
            </>
          )}
        </div>
        {right}
      </div>
    </section>
  );
}

export const GlowSection = HeroSection;
export const PageHero = HeroSection;
