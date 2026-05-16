import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type CheckboxFieldProps = {
  checked: boolean;
  className?: string;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};

export function CheckboxField({ checked, className, disabled = false, label, onCheckedChange }: CheckboxFieldProps) {
  const id = useId();

  return (
    <div className={cn("inline-flex min-h-10 items-center gap-2", className)}>
      <Checkbox
        checked={checked}
        disabled={disabled}
        id={id}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <label className="text-xs font-semibold text-muted-foreground" htmlFor={id}>{label}</label>
    </div>
  );
}
