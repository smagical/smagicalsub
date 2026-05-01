import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FilterFieldProps = {
  children: ReactNode;
  className?: string;
  label: string;
};

export function FilterField({ children, className, label }: FilterFieldProps) {
  return (
    // 统一筛选栏和短表单的 label/span 结构，减少各页面重复布局代码。
    <label className={cn("grid min-w-[180px] gap-1.5", className)}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
