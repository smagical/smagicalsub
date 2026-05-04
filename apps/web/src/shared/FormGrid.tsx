import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const formGridColumns = {
  node: "grid-cols-[minmax(280px,1.6fr)_minmax(160px,0.7fr)_minmax(160px,0.7fr)_auto_auto]",
  profile: "grid-cols-[minmax(180px,0.8fr)_minmax(140px,0.6fr)_minmax(260px,1.4fr)_auto_auto]",
  rule: "grid-cols-[minmax(320px,1.6fr)_minmax(120px,0.4fr)_auto_auto]",
  source: "grid-cols-[minmax(132px,0.75fr)_minmax(260px,1.7fr)_minmax(72px,auto)_minmax(132px,0.7fr)_72px]",
  token: "grid-cols-[minmax(140px,0.7fr)_minmax(170px,0.7fr)_minmax(190px,0.8fr)_minmax(160px,0.7fr)_minmax(240px,1.2fr)_auto_auto]"
} as const;

type FormGridProps = ComponentProps<"form"> & {
  variant?: keyof typeof formGridColumns;
};

export function FormGrid({ className, variant = "source", ...props }: FormGridProps) {
  // 每类创建表单字段数量不同，列模板集中在这里，避免页面散落魔术列宽。
  return <form className={cn("mb-4 grid items-end gap-3 max-[920px]:grid-cols-1", formGridColumns[variant], className)} {...props} />;
}
