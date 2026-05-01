import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type EyebrowProps = ComponentProps<"p">;

export function Eyebrow({ className, ...props }: EyebrowProps) {
  return <p className={cn("mb-1.5 text-xs font-semibold uppercase tracking-normal text-muted-foreground", className)} {...props} />;
}
