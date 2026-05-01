import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ActionGroupProps = ComponentProps<"div">;

export function ActionGroup({ className, ...props }: ActionGroupProps) {
  // 表格动作区需要允许按钮换行，避免窄屏或多动作列挤出表格。
  return <div className={cn("inline-flex flex-wrap gap-2", className)} {...props} />;
}
