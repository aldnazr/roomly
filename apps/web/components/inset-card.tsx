import * as React from "react";
import { cn } from "@/lib/utils";

interface InsetCardProps extends React.ComponentProps<"div"> {
  innerClassName?: string;
  as?: React.ElementType;
}

export function InsetCard({
  className,
  innerClassName,
  children,
  as: Component = "div",
  ...props
}: InsetCardProps) {
  return (
    <Component
      className={cn(
        "rounded-[2rem] bg-muted/40 ring-1 ring-foreground/5",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "rounded-[1.5rem] bg-card p-5 shadow-[inset_0_1px_1px_rgb(255_255_255/0.16)] sm:p-7",
          innerClassName,
        )}
      >
        {children}
      </div>
    </Component>
  );
}
