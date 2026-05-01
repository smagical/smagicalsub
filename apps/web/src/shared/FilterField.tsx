import type { ReactNode } from "react";

type FilterFieldProps = {
  children: ReactNode;
  className?: string;
  label: string;
};

export function FilterField({ children, className, label }: FilterFieldProps) {
  return (
    // 统一筛选栏和短表单的 label/span 结构，减少各页面重复布局代码。
    <label className={className}>
      <span>{label}</span>
      {children}
    </label>
  );
}
