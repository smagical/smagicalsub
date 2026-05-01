import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type FilterBarProps = ComponentProps<"div"> & {
  align?: "end" | "start";
};

export function FilterBar({ align = "end", className, ...props }: FilterBarProps) {
  const alignment = align === "start" ? "justify-start" : "justify-end max-[920px]:justify-stretch";

  // 筛选栏在窄屏下让字段占满整行，按钮保持自然宽度，避免输入框被挤压。
  return <div className={cn("mb-3.5 flex flex-wrap items-end gap-3 [&>label]:max-[920px]:w-full", alignment, className)} {...props} />;
}
