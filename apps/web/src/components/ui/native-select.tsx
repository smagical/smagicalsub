import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        // 保留原生 select 行为，作为完整 shadcn Select 拆分前的轻量过渡组件。
        "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
